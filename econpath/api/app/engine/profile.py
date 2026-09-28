import math
from dataclasses import dataclass

from app.domain import City, College, Major, Occupation

from . import constants as c


def career_curve(start: float, mid: float, t: float) -> float:
    if t <= c.CURVE_PEAK_YEAR:
        progress = (1 - math.exp(-t / c.CURVE_K)) / (1 - math.exp(-c.CURVE_PEAK_YEAR / c.CURVE_K))
        return start + (mid - start) * progress
    return mid * (1 + c.CURVE_LATE_REAL_GROWTH) ** (t - c.CURVE_PEAK_YEAR)


def college_factor(college: College) -> float:
    raw = (college.median_earnings_10yr / c.NATIONAL_COLLEGE_MEDIAN_EARNINGS_10YR) ** c.ELASTICITY_COLLEGE
    return min(c.COLLEGE_FACTOR_MAX, max(c.COLLEGE_FACTOR_MIN, raw))


def city_wage_factor(city: City) -> float:
    return (city.mean_wage / c.NATIONAL_MEAN_WAGE) ** c.ELASTICITY_CITY_WAGE


def non_housing_price_index(city: City) -> float:
    return 1 + (city.rpp / 100 - 1) * c.ELASTICITY_NON_HOUSING_PRICE


def monthly_living_total(city: City) -> float:
    npi = non_housing_price_index(city)
    b = c.LIVING_BASELINE
    return (b["groceries"] + b["utilities"] + b["personal"]) * npi + b["healthcare"] * (0.5 + 0.5 * npi) + city.transport_monthly


@dataclass(frozen=True)
class EarningsProfile:
    start: float
    mid: float
    source: str
    college_factor: float
    city_factor: float


def resolve_profile(
    college: College,
    college_city: City,
    city: City,
    major: Major | None = None,
    occupation: Occupation | None = None,
) -> EarningsProfile:
    cf = college_factor(college)
    lf = city_wage_factor(city)
    if occupation is not None:
        start = occupation.p10_wage + 0.35 * (occupation.median_wage - occupation.p10_wage)
        mid = occupation.median_wage + 0.35 * (occupation.p90_wage - occupation.median_wage)
        return EarningsProfile(start * cf * lf, mid * cf * lf, "career", cf, lf)
    if major is not None:
        return EarningsProfile(major.start_salary * cf * lf, major.mid_career_salary * cf * lf, "major", cf, lf)
    relocation = lf / city_wage_factor(college_city)
    shape = career_curve(1, c.INSTITUTION_MID_RATIO, c.SCORECARD_MEASURE_YEAR)
    start = college.median_earnings_10yr / shape * relocation
    return EarningsProfile(start, start * c.INSTITUTION_MID_RATIO, "institution", 1.0, relocation)
