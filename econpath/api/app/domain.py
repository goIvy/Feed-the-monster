"""Domain models shared by the repository, engine and API.

Field names are snake_case in Python and camelCase on the wire, matching the
web app's types in web/src/types/data.ts.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict


def to_camel(name: str) -> str:
    """snake_case -> camelCase, matching the seed build (job_growth_5yr -> jobGrowth5yr)."""
    head, *rest = name.split("_")
    return head + "".join(part.capitalize() for part in rest)


class Model(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, frozen=True)


Region = Literal["Northeast", "Midwest", "South", "West"]


class State(Model):
    code: str
    fips: str
    name: str
    region: Region
    rpp: float
    median_household_income: int
    median_rent: int
    unemployment_rate: float
    youth_unemployment_rate: float
    job_growth_5yr: float
    wage_index: float
    wage_growth: float
    public_tuition_in_state: int
    state_income_tax_rate: float


class City(Model):
    id: str
    name: str
    state: str
    region: Region
    lat: float
    lon: float
    metro_population_m: float
    rpp: float
    median_rent_1br: int
    median_home_price: int
    median_household_income: int
    mean_wage: int
    unemployment_rate: float
    youth_unemployment_rate: float
    job_growth_5yr: float
    wage_growth: float
    local_income_tax_rate: float
    transport_monthly: int


class College(Model):
    id: str
    name: str
    short_name: str
    city_id: str
    state: str
    control: Literal["public", "private"]
    undergrad_size: int
    acceptance_rate: float | None
    tuition_in_state: int
    tuition_out_of_state: int
    cost_of_attendance: int
    avg_net_price: int
    pct_receiving_grants: float
    avg_grant_aid: int
    grad_rate: float
    retention_rate: float
    median_earnings_10yr: int
    median_debt: int
    lat: float
    lon: float


class Major(Model):
    id: str
    name: str
    category: str
    cip_code: str
    start_salary: int
    mid_career_salary: int
    unemployment_rate: float
    underemployment_rate: float
    grad_school_rate: float
    job_growth: float
    mid_career_p25: int
    mid_career_p75: int
    top_occupations: list[str]
    industries: list[str]


class Occupation(Model):
    id: str
    soc_code: str
    title: str
    category: str
    median_wage: int
    p10_wage: int
    p90_wage: int
    employment: int
    growth_pct: float
    annual_openings: int
    education: str
    automation_exposure: int
    related_majors: list[str]


class DataSource(Model):
    id: str
    name: str
    publisher: str
    url: str
    dataset: str
    vintage: str
    update_frequency: str
    used_for: str
    methodology: str
    last_updated: str
