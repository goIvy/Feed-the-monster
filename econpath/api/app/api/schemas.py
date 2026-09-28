from dataclasses import asdict
from typing import Literal

from pydantic import Field

from app.domain import College, Model, to_camel
from app.engine.path import Assumptions, GradSchool, PathResult


class PathSelection(Model):
    college_id: str
    major_id: str | None = None
    occupation_id: str | None = None
    city_id: str | None = None
    residency: Literal["in-state", "out-of-state"] = "in-state"


class GradSchoolIn(Model):
    years: int = Field(2, ge=1, le=8)
    annual_cost: float = Field(ge=0)
    salary_premium: float = Field(ge=-0.5, le=2)


class AssumptionsIn(Model):
    """Every field is optional; omitted fields use the documented defaults."""

    inflation: float | None = Field(None, ge=-0.02, le=0.2)
    tuition_inflation: float | None = Field(None, ge=-0.05, le=0.2)
    loan_rate: float | None = Field(None, ge=0, le=0.25)
    loan_term_years: int | None = Field(None, ge=1, le=30)
    discount_rate: float | None = Field(None, ge=0, le=0.2)
    horizon_age: int | None = Field(None, ge=24, le=70)
    tuition_change: float | None = Field(None, ge=-1, le=3)
    rent_change: float | None = Field(None, ge=-1, le=3)
    salary_change: float | None = Field(None, ge=-0.9, le=3)
    scholarship_per_year: float | None = Field(None, ge=0)
    family_contribution_per_year: float | None = Field(None, ge=0)
    borrowing_total: float | None = Field(None, ge=0)
    grant_aid_override: float | None = Field(None, ge=0)
    rent_override: float | None = Field(None, ge=0)
    salary_override: float | None = Field(None, ge=0)
    living_with_family_years: int | None = Field(None, ge=0, le=10)
    housing_share: float | None = Field(None, gt=0, le=1)
    savings_rate: float | None = Field(None, ge=0, le=1)
    retirement_rate: float | None = Field(None, ge=0, le=0.5)
    investment_return: float | None = Field(None, ge=-0.1, le=0.2)
    tax_change: float | None = Field(None, ge=-0.2, le=0.2)
    grad_school: GradSchoolIn | None = None

    def to_engine(self) -> Assumptions:
        values = {k: v for k, v in self.model_dump(exclude_none=True).items() if k != "grad_school"}
        if self.grad_school:
            values["grad_school"] = GradSchool(**self.grad_school.model_dump())
        return Assumptions(**values)


class SimulateRequest(Model):
    paths: list[PathSelection] = Field(min_length=1, max_length=5)
    assumptions: AssumptionsIn = AssumptionsIn()
    include_rows: bool = True


def camel_dict(obj) -> dict:
    return {to_camel(k): v for k, v in (obj if isinstance(obj, dict) else asdict(obj)).items()}


def serialize_result(r: PathResult, include_rows: bool) -> dict:
    out = {"profile": camel_dict(r.profile), "summary": camel_dict(r.summary)}
    if include_rows:
        out["rows"] = [camel_dict(row) for row in r.rows]
    return out


class CollegeMetrics(Model):
    college: College
    net_price: float
    total_cost: float
    debt: float
    monthly_payment: float
    starting_salary: float
    earnings5: float
    earnings10: float
    earnings20: float
    breakeven_age: int | None
    npv: float
    roi: float
    rpp: float
    adjusted_salary: float
