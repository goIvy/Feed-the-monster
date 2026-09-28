"""Year-by-year path simulation. Mirrors web/src/lib/engine/path.ts."""

from dataclasses import dataclass, field, replace
from typing import Literal

from app.domain import City, College, Major, Occupation

from . import constants as c
from .loans import monthly_payment
from .profile import EarningsProfile, career_curve, city_wage_factor, monthly_living_total, resolve_profile
from .tax import compute_taxes

Residency = Literal["in-state", "out-of-state"]
Phase = Literal["college", "grad-school", "work"]


@dataclass(frozen=True)
class GradSchool:
    years: int
    annual_cost: float
    salary_premium: float


@dataclass(frozen=True)
class Assumptions:
    inflation: float = 0.025
    tuition_inflation: float = 0.03
    loan_rate: float = 0.0639
    loan_term_years: int = 10
    discount_rate: float = 0.03
    start_age: int = 18
    horizon_age: int = 40
    years_in_school: int = 4
    tuition_change: float = 0.0
    rent_change: float = 0.0
    salary_change: float = 0.0
    scholarship_per_year: float = 0.0
    family_contribution_per_year: float | None = None
    borrowing_total: float | None = None
    grant_aid_override: float | None = None
    rent_override: float | None = None
    salary_override: float | None = None
    living_with_family_years: int = 0
    housing_share: float = 1.0
    savings_rate: float = 0.10
    retirement_rate: float = 0.05
    investment_return: float = 0.06
    tax_change: float = 0.0
    grad_school: GradSchool | None = None
    base_year: int = c.BASE_YEAR


@dataclass(frozen=True)
class PathInput:
    college: College
    college_city: City
    city: City
    state_tax_rate: float
    major: Major | None = None
    occupation: Occupation | None = None
    residency: Residency = "in-state"


@dataclass
class YearRow:
    index: int
    calendar_year: int
    age: int
    phase: Phase
    price_index: float
    gross: float = 0.0
    taxes: float = 0.0
    retirement: float = 0.0
    take_home: float = 0.0
    rent: float = 0.0
    living: float = 0.0
    loan_payment: float = 0.0
    interest_paid: float = 0.0
    disposable: float = 0.0
    savings: float = 0.0
    education_cost: float = 0.0
    new_borrowing: float = 0.0
    debt_balance: float = 0.0
    assets: float = 0.0
    net_worth: float = 0.0
    cumulative_earnings: float = 0.0
    high_school_gross: float = 0.0
    cumulative_high_school: float = 0.0
    cumulative_net_gain: float = 0.0


@dataclass
class PathSummary:
    starting_salary: float
    starting_salary_today: float
    salary_year10: float
    salary_year10_today: float
    annual_net_price: float
    total_college_cost: float
    debt_at_graduation: float
    monthly_loan_payment: float
    total_interest: float
    debt_free_age: int | None
    monthly_disposable: float
    purchasing_power: float
    adjusted_starting_salary: float
    breakeven_age: int | None
    breakeven_years_after_enrollment: int | None
    earnings5: float
    earnings10: float
    earnings20: float
    lifetime_earnings: float
    net_present_value: float
    roi: float
    net_worth_at_horizon: float
    graduation_age: int


@dataclass
class PathResult:
    profile: EarningsProfile
    rows: list[YearRow] = field(default_factory=list)
    summary: PathSummary | None = None


def cost_of_attendance(college: College, residency: Residency = "in-state") -> float:
    if college.control == "public" and residency == "out-of-state":
        return college.cost_of_attendance + (college.tuition_out_of_state - college.tuition_in_state)
    return college.cost_of_attendance


def base_net_price(college: College, residency: Residency = "in-state") -> float:
    if college.control == "public" and residency == "out-of-state":
        return college.avg_net_price + (college.tuition_out_of_state - college.tuition_in_state) * c.OUT_OF_STATE_PASS_THROUGH
    return college.avg_net_price


def typical_loan_share(college: College, years_in_school: int = 4) -> float:
    if college.avg_net_price <= 0:
        return 0.0
    return min(0.9, max(0.0, college.median_debt / (years_in_school * college.avg_net_price)))


def simulate_path(inp: PathInput, a: Assumptions | None = None) -> PathResult:
    a = a or Assumptions()
    college, city = inp.college, inp.city

    base = resolve_profile(college, inp.college_city, city, inp.major, inp.occupation)
    grad_premium = 1 + a.grad_school.salary_premium if a.grad_school else 1
    scale = (1 + a.salary_change) * grad_premium
    start, mid = base.start * scale, base.mid * scale
    if a.salary_override is not None and a.salary_override > 0:
        mid = mid * (a.salary_override / start)
        start = a.salary_override
    profile = replace(base, start=start, mid=mid)

    grad_years = max(0, round(a.grad_school.years)) if a.grad_school else 0
    school_years = a.years_in_school + grad_years
    total_years = max(school_years + 1, a.horizon_age - a.start_age + 1)

    price = (
        max(0.0, cost_of_attendance(college, inp.residency) - a.grant_aid_override)
        if a.grant_aid_override is not None
        else base_net_price(college, inp.residency)
    )
    annual_net = max(0.0, price * (1 + a.tuition_change) - a.scholarship_per_year)
    loan_share = typical_loan_share(college, a.years_in_school)
    living_month = monthly_living_total(city)
    base_rent = (a.rent_override if a.rent_override is not None else city.median_rent_1br * a.housing_share) * (1 + a.rent_change)
    hs_city = city_wage_factor(city)
    nominal_discount = (1 + a.discount_rate) * (1 + a.inflation) - 1

    rows: list[YearRow] = []
    debt = assets = annual_payment = 0.0
    cum_earn = cum_hs = cum_gain = 0.0
    total_cost = total_interest = debt_at_grad = 0.0
    debt_free_age: int | None = None
    npv = pv_invest = 0.0
    breakeven_index: int | None = None

    for i in range(total_years):
        age = a.start_age + i
        pi = (1 + a.inflation) ** i
        hs_gross = career_curve(c.HIGH_SCHOOL_START, c.HIGH_SCHOOL_MID, i) * hs_city * pi
        discount = (1 + nominal_discount) ** i
        row = YearRow(index=i, calendar_year=a.base_year + i, age=age, phase="work", price_index=pi)

        if i < a.years_in_school:
            row.phase = "college"
            row.education_cost = annual_net * (1 + a.tuition_inflation) ** i
            if a.borrowing_total is not None:
                row.new_borrowing = min(row.education_cost, max(0.0, a.borrowing_total) / a.years_in_school)
            elif a.family_contribution_per_year is not None:
                row.new_borrowing = max(0.0, row.education_cost - a.family_contribution_per_year * pi)
            else:
                row.new_borrowing = row.education_cost * loan_share
            total_cost += row.education_cost
            debt = (debt + row.new_borrowing) * (1 + a.loan_rate)
        elif i < school_years and a.grad_school:
            row.phase = "grad-school"
            row.education_cost = a.grad_school.annual_cost * (1 + a.tuition_inflation) ** i
            row.new_borrowing = row.education_cost
            debt = (debt + row.new_borrowing) * (1 + a.loan_rate)
        else:
            t = i - school_years
            if t == 0:
                debt_at_grad = debt
                annual_payment = monthly_payment(debt, a.loan_rate, a.loan_term_years) * 12
                if debt <= 0:
                    debt_free_age = age
            row.gross = career_curve(profile.start, profile.mid, t) * pi
            row.retirement = row.gross * a.retirement_rate
            tax = compute_taxes(
                row.gross,
                inp.state_tax_rate,
                pretax_retirement=row.retirement,
                local_rate=city.local_income_tax_rate,
                scale=pi,
                adjustment=a.tax_change,
            )
            row.taxes, row.take_home = tax.total, tax.take_home
            if debt > 0:
                row.interest_paid = debt * a.loan_rate
                row.loan_payment = min(annual_payment, debt + row.interest_paid)
                debt = debt + row.interest_paid - row.loan_payment
                if debt < 1:
                    debt = 0.0
                    debt_free_age = age
            at_home = t < a.living_with_family_years
            row.rent = 0.0 if at_home else base_rent * 12 * pi
            row.living = living_month * 12 * pi * (0.6 if at_home else 1.0)
            row.disposable = row.take_home - row.rent - row.living - row.loan_payment
            row.savings = max(0.0, min(row.take_home * a.savings_rate, row.disposable))
            total_interest += row.interest_paid

        assets = assets * (1 + a.investment_return) + row.retirement + (row.disposable if row.disposable < 0 else row.savings)
        cum_earn += row.gross
        cum_hs += hs_gross
        flow = row.gross - row.education_cost - row.interest_paid - hs_gross
        cum_gain += flow
        npv += flow / discount
        if row.phase != "work":
            pv_invest += (row.education_cost + hs_gross) / discount
        if breakeven_index is None and row.phase == "work" and cum_gain >= 0:
            breakeven_index = i

        row.debt_balance = debt
        row.assets = assets
        row.net_worth = assets - debt
        row.cumulative_earnings = cum_earn
        row.high_school_gross = hs_gross
        row.cumulative_high_school = cum_hs
        row.cumulative_net_gain = cum_gain
        rows.append(row)

    work = [r for r in rows if r.phase == "work"]
    first = work[0]
    y10 = work[min(9, len(work) - 1)]
    rpp = city.rpp / 100

    summary = PathSummary(
        starting_salary=first.gross,
        starting_salary_today=first.gross / first.price_index,
        salary_year10=y10.gross,
        salary_year10_today=y10.gross / y10.price_index,
        annual_net_price=annual_net,
        total_college_cost=total_cost,
        debt_at_graduation=debt_at_grad,
        monthly_loan_payment=annual_payment / 12,
        total_interest=total_interest,
        debt_free_age=debt_free_age,
        monthly_disposable=first.disposable / 12,
        purchasing_power=first.take_home / first.price_index / rpp,
        adjusted_starting_salary=first.gross / first.price_index / rpp,
        breakeven_age=None if breakeven_index is None else a.start_age + breakeven_index,
        breakeven_years_after_enrollment=None if breakeven_index is None else breakeven_index + 1,
        earnings5=sum(r.gross for r in work[:5]),
        earnings10=sum(r.gross for r in work[:10]),
        earnings20=sum(r.gross for r in work[:20]),
        lifetime_earnings=cum_earn,
        net_present_value=npv,
        roi=npv / pv_invest if pv_invest > 0 else 0.0,
        net_worth_at_horizon=rows[-1].net_worth,
        graduation_age=a.start_age + school_years,
    )
    return PathResult(profile=profile, rows=rows, summary=summary)
