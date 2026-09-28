from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.schemas import CollegeMetrics
from app.domain import City, College, DataSource, Major, Occupation, State
from app.engine.path import simulate_path
from app.repository import Catalog, get_catalog

router = APIRouter(prefix="/v1", tags=["reference data"])


def _get(pool: dict, id_: str, kind: str):
    item = pool.get(id_)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{kind} '{id_}' not found")
    return item


def college_metrics(cat: Catalog, college: College, major_id: str | None, residency: str) -> CollegeMetrics:
    s = simulate_path(cat.path_input(college.id, major_id=major_id, residency=residency)).summary
    return CollegeMetrics(
        college=college,
        net_price=s.annual_net_price,
        total_cost=s.total_college_cost,
        debt=s.debt_at_graduation,
        monthly_payment=s.monthly_loan_payment,
        starting_salary=s.starting_salary_today,
        earnings5=s.earnings5,
        earnings10=s.earnings10,
        earnings20=s.earnings20,
        breakeven_age=s.breakeven_age,
        npv=s.net_present_value,
        roi=s.roi,
        rpp=cat.cities[college.city_id].rpp,
        adjusted_salary=s.adjusted_starting_salary,
    )


SORTS = {
    "roi": (lambda m: m.roi, True),
    "npv": (lambda m: m.npv, True),
    "earnings": (lambda m: m.college.median_earnings_10yr, True),
    "net_price": (lambda m: m.net_price, False),
    "debt": (lambda m: m.debt, False),
    "grad_rate": (lambda m: m.college.grad_rate, True),
    "name": (lambda m: m.college.short_name, False),
}


@router.get("/colleges", response_model=list[CollegeMetrics], response_model_by_alias=True)
def list_colleges(
    q: str | None = None,
    state: str | None = None,
    control: Literal["public", "private"] | None = None,
    max_net_price: float | None = Query(None, alias="maxNetPrice", ge=0),
    min_grad_rate: float | None = Query(None, alias="minGradRate", ge=0, le=1),
    min_earnings: float | None = Query(None, alias="minEarnings", ge=0),
    max_debt: float | None = Query(None, alias="maxDebt", ge=0),
    min_roi: float | None = Query(None, alias="minRoi"),
    major: str | None = None,
    residency: Literal["in-state", "out-of-state"] = "in-state",
    sort: Literal["roi", "npv", "earnings", "net_price", "debt", "grad_rate", "name"] = "roi",
    limit: int = Query(55, ge=1, le=500),
    cat: Catalog = Depends(get_catalog),
):
    if major and major not in cat.majors:
        raise HTTPException(404, f"major '{major}' not found")
    out = []
    for c in cat.colleges.values():
        if q and q.lower() not in f"{c.name} {c.short_name} {c.state}".lower():
            continue
        if state and c.state != state.upper():
            continue
        if control and c.control != control:
            continue
        if min_grad_rate is not None and c.grad_rate < min_grad_rate:
            continue
        if min_earnings is not None and c.median_earnings_10yr < min_earnings:
            continue
        m = college_metrics(cat, c, major, residency)
        if max_net_price is not None and m.net_price > max_net_price:
            continue
        if max_debt is not None and m.debt > max_debt:
            continue
        if min_roi is not None and m.roi < min_roi:
            continue
        out.append(m)
    key, desc = SORTS[sort]
    return sorted(out, key=key, reverse=desc)[:limit]


@router.get("/colleges/compare", response_model=list[CollegeMetrics], response_model_by_alias=True)
def compare_colleges(
    ids: str = Query(..., description="Comma-separated college ids, up to 5"),
    major: str | None = None,
    residency: Literal["in-state", "out-of-state"] = "in-state",
    cat: Catalog = Depends(get_catalog),
):
    wanted = [i for i in ids.split(",") if i][:5]
    return [college_metrics(cat, _get(cat.colleges, i, "college"), major, residency) for i in wanted]


@router.get("/colleges/{college_id}", response_model=College, response_model_by_alias=True)
def get_college(college_id: str, cat: Catalog = Depends(get_catalog)):
    return _get(cat.colleges, college_id, "college")


@router.get("/majors", response_model=list[Major], response_model_by_alias=True)
def list_majors(category: str | None = None, cat: Catalog = Depends(get_catalog)):
    return [m for m in cat.majors.values() if not category or m.category == category]


@router.get("/majors/{major_id}", response_model=Major, response_model_by_alias=True)
def get_major(major_id: str, cat: Catalog = Depends(get_catalog)):
    return _get(cat.majors, major_id, "major")


@router.get("/careers", response_model=list[Occupation], response_model_by_alias=True)
def list_careers(q: str | None = None, category: str | None = None, cat: Catalog = Depends(get_catalog)):
    return [
        o
        for o in cat.occupations.values()
        if (not category or o.category == category) and (not q or q.lower() in o.title.lower())
    ]


@router.get("/careers/{career_id}", response_model=Occupation, response_model_by_alias=True)
def get_career(career_id: str, cat: Catalog = Depends(get_catalog)):
    return _get(cat.occupations, career_id, "career")


@router.get("/cities", response_model=list[City], response_model_by_alias=True)
def list_cities(region: str | None = None, cat: Catalog = Depends(get_catalog)):
    return [c for c in cat.cities.values() if not region or c.region == region]


@router.get("/cities/{city_id}", response_model=City, response_model_by_alias=True)
def get_city(city_id: str, cat: Catalog = Depends(get_catalog)):
    return _get(cat.cities, city_id, "city")


@router.get("/states", response_model=list[State], response_model_by_alias=True)
def list_states(cat: Catalog = Depends(get_catalog)):
    return list(cat.states.values())


@router.get("/sources", response_model=list[DataSource], response_model_by_alias=True)
def list_sources(cat: Catalog = Depends(get_catalog)):
    return list(cat.sources.values())
