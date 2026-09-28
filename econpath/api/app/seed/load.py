"""Load the validated seed into the normalized PostgreSQL schema.

    ECONPATH_DATABASE_URL=postgresql+psycopg://... python -m app.seed.load --reset
"""

import argparse
from datetime import date

from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.db import models as m
from app.db.session import get_engine

from .build import build, to_records

YEAR = {"college": "2023-24", "bls": 2024, "laus": 2025, "acs": 2024, "rpp": 2023, "nyfed": 2025, "proj": 2024}


def load(reset: bool = False) -> dict[str, int]:
    t = {name: to_records(df, camel_keys=False) for name, df in build(check_only=True).items()}
    engine = get_engine()
    if reset:
        m.Base.metadata.drop_all(engine)
    m.Base.metadata.create_all(engine)

    with Session(engine) as s, s.begin():
        s.execute(
            insert(m.DataSource),
            [{**r, "last_updated": date.fromisoformat(r["last_updated"])} for r in t["data_sources"]],
        )
        s.execute(
            insert(m.State),
            [
                {k: r[k] for k in ("code", "fips", "name", "region", "state_income_tax_rate", "public_tuition_in_state", "rpp", "wage_index")}
                for r in t["states"]
            ],
        )
        s.execute(
            insert(m.EmploymentData),
            [
                {
                    "state_code": r["code"],
                    "source_id": "acs",
                    "year": YEAR["acs"],
                    "unemployment_rate": r["unemployment_rate"],
                    "youth_unemployment_rate": r["youth_unemployment_rate"],
                    "job_growth_pct": r["job_growth_5yr"],
                    "wage_growth": r["wage_growth"],
                    "median_household_income": r["median_household_income"],
                    "median_rent": r["median_rent"],
                }
                for r in t["states"]
            ],
        )
        s.execute(
            insert(m.City),
            [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "state_code": r["state"],
                    "region": r["region"],
                    "lat": r["lat"],
                    "lon": r["lon"],
                    "metro_population_m": r["metro_population_m"],
                    "local_income_tax_rate": r["local_income_tax_rate"],
                }
                for r in t["cities"]
            ],
        )
        s.execute(
            insert(m.LivingCost),
            [
                {
                    "city_id": r["id"],
                    "source_id": "bea-rpp",
                    "year": YEAR["rpp"],
                    "rpp": r["rpp"],
                    "median_rent_1br": r["median_rent_1br"],
                    "median_home_price": r["median_home_price"],
                    "transport_monthly": r["transport_monthly"],
                }
                for r in t["cities"]
            ],
        )
        s.execute(
            insert(m.EmploymentData),
            [
                {
                    "city_id": r["id"],
                    "source_id": "bls-laus",
                    "year": YEAR["laus"],
                    "unemployment_rate": r["unemployment_rate"],
                    "youth_unemployment_rate": r["youth_unemployment_rate"],
                    "job_growth_pct": r["job_growth_5yr"],
                    "mean_wage": r["mean_wage"],
                    "wage_growth": r["wage_growth"],
                    "median_household_income": r["median_household_income"],
                }
                for r in t["cities"]
            ],
        )
        s.execute(
            insert(m.College),
            [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "short_name": r["short_name"],
                    "city_id": r["city_id"],
                    "state_code": r["state"],
                    "control": r["control"],
                    "undergrad_size": r["undergrad_size"],
                    "acceptance_rate": r["acceptance_rate"],
                    "grad_rate": r["grad_rate"],
                    "retention_rate": r["retention_rate"],
                    "lat": r["lat"],
                    "lon": r["lon"],
                }
                for r in t["colleges"]
            ],
        )
        s.execute(
            insert(m.CollegeCost),
            [
                {
                    "college_id": r["id"],
                    "source_id": "college-scorecard",
                    "academic_year": YEAR["college"],
                    **{k: r[k] for k in ("tuition_in_state", "tuition_out_of_state", "cost_of_attendance", "avg_net_price", "pct_receiving_grants", "avg_grant_aid", "median_debt")},
                }
                for r in t["colleges"]
            ],
        )
        s.execute(
            insert(m.Major),
            [{k: r[k] for k in ("id", "name", "category", "cip_code", "industries", "grad_school_rate")} for r in t["majors"]],
        )
        s.execute(
            insert(m.Career),
            [{"id": r["id"], "soc_code": r["soc_code"], "title": r["title"], "category": r["category"], "education": r["education"], "automation_exposure": r["automation_exposure"]} for r in t["occupations"]],
        )

        links: dict[tuple[str, str], dict] = {}
        for r in t["majors"]:
            for rank, occ in enumerate(r["top_occupations"], 1):
                links.setdefault((r["id"], occ), {"major_id": r["id"], "career_id": occ, "major_rank": None, "career_rank": None})["major_rank"] = rank
        for r in t["occupations"]:
            for rank, maj in enumerate(r["related_majors"], 1):
                links.setdefault((maj, r["id"]), {"major_id": maj, "career_id": r["id"], "major_rank": None, "career_rank": None})["career_rank"] = rank
        s.execute(insert(m.MajorCareer), list(links.values()))

        s.execute(
            insert(m.SalaryData),
            [
                {"subject": "career", "career_id": r["id"], "geography": "national", "source_id": "bls-oews", "year": YEAR["bls"], "p10": r["p10_wage"], "median": r["median_wage"], "p90": r["p90_wage"]}
                for r in t["occupations"]
            ]
            + [
                {
                    "subject": "major",
                    "major_id": r["id"],
                    "geography": "national",
                    "source_id": "ny-fed-grads",
                    "year": YEAR["nyfed"],
                    "p25": r["mid_career_p25"],
                    "p75": r["mid_career_p75"],
                    "early_career_median": r["start_salary"],
                    "mid_career_median": r["mid_career_salary"],
                }
                for r in t["majors"]
            ]
            + [
                {"subject": "college", "college_id": r["id"], "geography": "national", "source_id": "college-scorecard", "year": 2023, "median": r["median_earnings_10yr"]}
                for r in t["colleges"]
            ],
        )
        s.execute(
            insert(m.EmploymentData),
            [
                {"career_id": r["id"], "source_id": "bls-ep", "year": YEAR["proj"], "job_growth_pct": r["growth_pct"], "employment": r["employment"], "annual_openings": r["annual_openings"]}
                for r in t["occupations"]
            ]
            + [
                {
                    "major_id": r["id"],
                    "source_id": "ny-fed-grads",
                    "year": YEAR["nyfed"],
                    "unemployment_rate": r["unemployment_rate"],
                    "underemployment_rate": r["underemployment_rate"],
                    "job_growth_pct": r["job_growth"],
                }
                for r in t["majors"]
            ],
        )
    return {name: len(rows) for name, rows in t.items()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="drop and recreate all tables first")
    args = parser.parse_args()
    counts = load(reset=args.reset)
    print("loaded " + ", ".join(f"{v} {k}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
