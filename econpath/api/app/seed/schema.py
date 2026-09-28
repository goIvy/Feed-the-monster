"""Column contracts for the seed CSVs.

Each table lists its columns with a type and an allowed range. The build step
fails loudly if a file drifts from its contract, so replacing seed data with a
live ingestion job only requires producing files that satisfy the same shape.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Col:
    name: str
    kind: str  # "str" | "int" | "float" | "list"
    lo: float | None = None
    hi: float | None = None
    nullable: bool = False


STATES = [
    Col("code", "str"), Col("fips", "str"), Col("name", "str"), Col("region", "str"),
    Col("rpp", "float", 70, 140), Col("median_household_income", "int", 30000, 150000),
    Col("median_rent", "int", 500, 3500), Col("unemployment_rate", "float", 0, 15),
    Col("youth_unemployment_rate", "float", 0, 30), Col("job_growth_5yr", "float", -10, 30),
    Col("wage_index", "float", 0.6, 1.6), Col("wage_growth", "float", 0, 10),
    Col("public_tuition_in_state", "int", 0, 25000), Col("state_income_tax_rate", "float", 0, 0.12),
]

CITIES = [
    Col("id", "str"), Col("name", "str"), Col("state", "str"), Col("region", "str"),
    Col("lat", "float", 18, 65), Col("lon", "float", -170, -60), Col("metro_population_m", "float", 0.05, 25),
    Col("rpp", "float", 70, 140), Col("median_rent_1br", "int", 500, 5000),
    Col("median_home_price", "int", 100000, 2500000), Col("median_household_income", "int", 30000, 200000),
    Col("mean_wage", "int", 35000, 150000), Col("unemployment_rate", "float", 0, 15),
    Col("youth_unemployment_rate", "float", 0, 30), Col("job_growth_5yr", "float", -10, 40),
    Col("wage_growth", "float", 0, 10), Col("local_income_tax_rate", "float", 0, 0.06),
    Col("transport_monthly", "int", 100, 1500),
]

COLLEGES = [
    Col("id", "str"), Col("name", "str"), Col("short_name", "str"), Col("city_id", "str"), Col("state", "str"),
    Col("control", "str"), Col("undergrad_size", "int", 500, 100000), Col("acceptance_rate", "float", 0, 1, nullable=True),
    Col("tuition_in_state", "int", 0, 90000), Col("tuition_out_of_state", "int", 0, 90000),
    Col("cost_of_attendance", "int", 5000, 120000), Col("avg_net_price", "int", 0, 80000),
    Col("pct_receiving_grants", "float", 0, 1), Col("avg_grant_aid", "int", 0, 90000),
    Col("grad_rate", "float", 0, 1), Col("retention_rate", "float", 0, 1),
    Col("median_earnings_10yr", "int", 15000, 200000), Col("median_debt", "int", 0, 60000),
    Col("lat", "float", 18, 65), Col("lon", "float", -170, -60),
]

MAJORS = [
    Col("id", "str"), Col("name", "str"), Col("category", "str"), Col("cip_code", "str"),
    Col("start_salary", "int", 20000, 150000), Col("mid_career_salary", "int", 30000, 250000),
    Col("unemployment_rate", "float", 0, 20), Col("underemployment_rate", "float", 0, 90),
    Col("grad_school_rate", "float", 0, 100), Col("job_growth", "float", -20, 50),
    Col("mid_career_p25", "int", 20000, 250000), Col("mid_career_p75", "int", 30000, 350000),
    Col("top_occupations", "list"), Col("industries", "list"),
]

OCCUPATIONS = [
    Col("id", "str"), Col("soc_code", "str"), Col("title", "str"), Col("category", "str"),
    Col("median_wage", "int", 15000, 250000), Col("p10_wage", "int", 10000, 250000),
    Col("p90_wage", "int", 20000, 250000), Col("employment", "int", 1000, 5000000),
    Col("growth_pct", "float", -40, 80), Col("annual_openings", "int", 0, 1000000),
    Col("education", "str"), Col("automation_exposure", "int", 0, 100), Col("related_majors", "list"),
]

DATA_SOURCES = [
    Col("id", "str"), Col("name", "str"), Col("publisher", "str"), Col("url", "str"), Col("dataset", "str"),
    Col("vintage", "str"), Col("update_frequency", "str"), Col("used_for", "str"), Col("methodology", "str"),
    Col("last_updated", "str"),
]

TABLES = {
    "states": STATES,
    "cities": CITIES,
    "colleges": COLLEGES,
    "majors": MAJORS,
    "occupations": OCCUPATIONS,
    "data_sources": DATA_SOURCES,
}
