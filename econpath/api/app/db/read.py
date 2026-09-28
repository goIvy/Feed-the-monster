"""Rebuild domain objects from the normalized schema (latest year per fact table)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models as m
from app.db.session import get_engine
from app.domain import City, College, DataSource, Major, Occupation, State
from app.repository import Catalog


def _latest(rows, key):
    """Keep the most recent row per key."""
    out = {}
    for r in sorted(rows, key=lambda r: r.year):
        out[key(r)] = r
    return out


def load_sql_catalog() -> Catalog:
    with Session(get_engine()) as s:
        emp = s.scalars(select(m.EmploymentData)).all()
        state_emp = _latest([e for e in emp if e.state_code], lambda e: e.state_code)
        city_emp = _latest([e for e in emp if e.city_id], lambda e: e.city_id)
        career_emp = _latest([e for e in emp if e.career_id], lambda e: e.career_id)
        major_emp = _latest([e for e in emp if e.major_id], lambda e: e.major_id)
        living = _latest(s.scalars(select(m.LivingCost)).all(), lambda r: r.city_id)
        sal = s.scalars(select(m.SalaryData).where(m.SalaryData.geography == "national")).all()
        career_sal = _latest([r for r in sal if r.career_id], lambda r: r.career_id)
        major_sal = _latest([r for r in sal if r.major_id], lambda r: r.major_id)
        college_sal = _latest([r for r in sal if r.college_id], lambda r: r.college_id)
        costs = {}
        for c in sorted(s.scalars(select(m.CollegeCost)).all(), key=lambda c: c.academic_year):
            costs[c.college_id] = c
        links = s.scalars(select(m.MajorCareer)).all()

        states = {
            st.code: State(
                code=st.code,
                fips=st.fips,
                name=st.name,
                region=st.region,
                rpp=st.rpp,
                median_household_income=state_emp[st.code].median_household_income,
                median_rent=state_emp[st.code].median_rent,
                unemployment_rate=state_emp[st.code].unemployment_rate,
                youth_unemployment_rate=state_emp[st.code].youth_unemployment_rate,
                job_growth_5yr=state_emp[st.code].job_growth_pct,
                wage_index=st.wage_index,
                wage_growth=state_emp[st.code].wage_growth,
                public_tuition_in_state=st.public_tuition_in_state,
                state_income_tax_rate=st.state_income_tax_rate,
            )
            for st in s.scalars(select(m.State)).all()
        }
        cities = {}
        for c in s.scalars(select(m.City)).all():
            lc, e = living[c.id], city_emp[c.id]
            cities[c.id] = City(
                id=c.id,
                name=c.name,
                state=c.state_code,
                region=c.region,
                lat=c.lat,
                lon=c.lon,
                metro_population_m=c.metro_population_m,
                rpp=lc.rpp,
                median_rent_1br=lc.median_rent_1br,
                median_home_price=lc.median_home_price,
                median_household_income=e.median_household_income,
                mean_wage=e.mean_wage,
                unemployment_rate=e.unemployment_rate,
                youth_unemployment_rate=e.youth_unemployment_rate,
                job_growth_5yr=e.job_growth_pct,
                wage_growth=e.wage_growth,
                local_income_tax_rate=c.local_income_tax_rate,
                transport_monthly=lc.transport_monthly,
            )
        colleges = {}
        for c in s.scalars(select(m.College)).all():
            k = costs[c.id]
            colleges[c.id] = College(
                id=c.id,
                name=c.name,
                short_name=c.short_name,
                city_id=c.city_id,
                state=c.state_code,
                control=c.control,
                undergrad_size=c.undergrad_size,
                acceptance_rate=c.acceptance_rate,
                tuition_in_state=k.tuition_in_state,
                tuition_out_of_state=k.tuition_out_of_state,
                cost_of_attendance=k.cost_of_attendance,
                avg_net_price=k.avg_net_price,
                pct_receiving_grants=k.pct_receiving_grants,
                avg_grant_aid=k.avg_grant_aid,
                grad_rate=c.grad_rate,
                retention_rate=c.retention_rate,
                median_earnings_10yr=college_sal[c.id].median,
                median_debt=k.median_debt,
                lat=c.lat,
                lon=c.lon,
            )

        def ranked(pairs):
            return [x for _, x in sorted(pairs)]

        majors = {}
        for mj in s.scalars(select(m.Major)).all():
            sd, e = major_sal[mj.id], major_emp[mj.id]
            majors[mj.id] = Major(
                id=mj.id,
                name=mj.name,
                category=mj.category,
                cip_code=mj.cip_code,
                start_salary=sd.early_career_median,
                mid_career_salary=sd.mid_career_median,
                unemployment_rate=e.unemployment_rate,
                underemployment_rate=e.underemployment_rate,
                grad_school_rate=mj.grad_school_rate,
                job_growth=e.job_growth_pct,
                mid_career_p25=sd.p25,
                mid_career_p75=sd.p75,
                top_occupations=ranked((ln.major_rank, ln.career_id) for ln in links if ln.major_id == mj.id and ln.major_rank),
                industries=list(mj.industries),
            )
        occupations = {}
        for cr in s.scalars(select(m.Career)).all():
            sd, e = career_sal[cr.id], career_emp[cr.id]
            occupations[cr.id] = Occupation(
                id=cr.id,
                soc_code=cr.soc_code,
                title=cr.title,
                category=cr.category,
                median_wage=sd.median,
                p10_wage=sd.p10,
                p90_wage=sd.p90,
                employment=e.employment,
                growth_pct=e.job_growth_pct,
                annual_openings=e.annual_openings,
                education=cr.education,
                automation_exposure=cr.automation_exposure,
                related_majors=ranked((ln.career_rank, ln.major_id) for ln in links if ln.career_id == cr.id and ln.career_rank),
            )
        sources = {
            d.id: DataSource(
                id=d.id,
                name=d.name,
                publisher=d.publisher,
                url=d.url,
                dataset=d.dataset,
                vintage=d.vintage,
                update_frequency=d.update_frequency,
                used_for=d.used_for,
                methodology=d.methodology,
                last_updated=d.last_updated.isoformat(),
            )
            for d in s.scalars(select(m.DataSource)).all()
        }
    return Catalog(states=states, cities=cities, colleges=colleges, majors=majors, occupations=occupations, sources=sources)
