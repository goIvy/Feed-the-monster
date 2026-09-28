from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.schemas import SimulateRequest, serialize_result
from app.engine.path import simulate_path
from app.engine.translate import equivalent_salary, monthly_leftover
from app.repository import Catalog, get_catalog
from app.research.roi_model import COVARIATES, OUTCOMES, fit_roi_model

router = APIRouter(prefix="/v1", tags=["models"])


@router.post("/simulate")
def simulate(req: SimulateRequest, cat: Catalog = Depends(get_catalog)):
    """Run the year-by-year path model for up to five paths under one set of assumptions."""
    assumptions = req.assumptions.to_engine()
    results = []
    for p in req.paths:
        try:
            inp = cat.path_input(p.college_id, p.major_id, p.occupation_id, p.city_id, p.residency)
        except KeyError as exc:
            raise HTTPException(404, str(exc)) from exc
        results.append({"path": p.model_dump(by_alias=True), **serialize_result(simulate_path(inp, assumptions), req.include_rows)})
    return {"results": results}


@router.get("/translate")
def translate(
    salary: float = Query(..., gt=0, le=10_000_000),
    from_city: str = Query(..., alias="from"),
    to: str = Query(..., description="Comma-separated city ids"),
    cat: Catalog = Depends(get_catalog),
):
    """Salary in each target city with the same after-tax purchasing power."""
    src = cat.cities.get(from_city)
    if src is None:
        raise HTTPException(404, f"city '{from_city}' not found")
    out = []
    for cid in [c for c in to.split(",") if c]:
        dst = cat.cities.get(cid)
        if dst is None:
            raise HTTPException(404, f"city '{cid}' not found")
        eq = equivalent_salary(salary, src, cat.state_tax_rate(src.state), dst, cat.state_tax_rate(dst.state))
        out.append({"cityId": cid, "equivalentSalary": eq, "monthlyLeftover": monthly_leftover(eq, dst, cat.state_tax_rate(dst.state))})
    return {"salary": salary, "from": from_city, "results": out}


@router.get("/research/roi-model")
def roi_model(
    outcome: str = Query("log_earnings", description=f"One of {sorted(OUTCOMES)}"),
    covariates: str | None = Query(None, description=f"Comma-separated subset of {sorted(COVARIATES)}"),
    cat: Catalog = Depends(get_catalog),
):
    """Explore the Research Lab's OLS model: toggle covariates and see coefficients update."""
    covs = None if covariates is None else [c for c in covariates.split(",") if c]
    unknown = [c for c in covs or [] if c not in COVARIATES]
    if unknown:
        raise HTTPException(422, f"unknown covariates {unknown}")
    try:
        return fit_roi_model(cat, outcome, covs)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
