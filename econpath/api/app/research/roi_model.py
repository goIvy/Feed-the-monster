"""Research Lab, study 1: what is associated with college earnings and ROI?

Ordinary least squares with heteroskedasticity-robust (HC1) standard errors.
The results describe associations in this dataset, not causal effects.
"""

import math
from functools import lru_cache

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

from app.engine.path import simulate_path
from app.repository import Catalog

COVARIATES = {
    "private": "Private (vs. public)",
    "log_net_price": "Log net price",
    "grad_rate": "Graduation rate",
    "log_size": "Log undergraduate enrollment",
    "rpp": "Regional price level",
    "region": "Region (vs. Midwest)",
}
OUTCOMES = {"log_earnings": "Log median earnings, 10 yrs after entry", "roi": "ROI to age 40"}


def frame(catalog: Catalog) -> pd.DataFrame:
    rows = []
    for c in catalog.colleges.values():
        city = catalog.cities[c.city_id]
        s = simulate_path(catalog.path_input(c.id)).summary
        rows.append(
            {
                "id": c.id,
                "log_earnings": math.log(c.median_earnings_10yr),
                "roi": s.roi,
                "private": int(c.control == "private"),
                "log_net_price": math.log(max(c.avg_net_price, 1)),
                "grad_rate": c.grad_rate,
                "log_size": math.log(c.undergrad_size),
                "rpp": city.rpp,
                "region": city.region,
            }
        )
    return pd.DataFrame(rows)


_frames: dict[int, pd.DataFrame] = {}


@lru_cache(maxsize=128)
def _fit(outcome: str, covariates: tuple[str, ...], catalog_id: int):
    df = _frames[catalog_id]
    terms = [("C(region, Treatment('Midwest'))" if c == "region" else c) for c in covariates]
    formula = f"{outcome} ~ " + (" + ".join(terms) if terms else "1")
    return smf.ols(formula, data=df).fit(cov_type="HC1"), len(df)


def fit_roi_model(catalog: Catalog, outcome: str = "log_earnings", covariates: list[str] | None = None) -> dict:
    if outcome not in OUTCOMES:
        raise ValueError(f"unknown outcome {outcome}")
    covs = tuple(c for c in (covariates if covariates is not None else list(COVARIATES)) if c in COVARIATES)
    if id(catalog) not in _frames:
        _frames[id(catalog)] = frame(catalog)
    model, n = _fit(outcome, covs, id(catalog))
    ci = model.conf_int()
    coefficients = []
    for name in model.params.index:
        label = "Intercept" if name == "Intercept" else COVARIATES.get(name, name.replace("C(region, Treatment('Midwest'))[T.", "Region: ").rstrip("]"))
        coefficients.append(
            {
                "term": name,
                "label": label,
                "estimate": float(model.params[name]),
                "stdError": float(model.bse[name]),
                "pValue": float(model.pvalues[name]),
                "ciLow": float(ci.loc[name, 0]),
                "ciHigh": float(ci.loc[name, 1]),
            }
        )
    return {
        "outcome": outcome,
        "outcomeLabel": OUTCOMES[outcome],
        "covariates": list(covs),
        "n": n,
        "rSquared": float(model.rsquared),
        "adjRSquared": float(model.rsquared_adj),
        "coefficients": coefficients,
        "standardErrors": "HC1 (heteroskedasticity-robust)",
        "caveat": "Associations only. Colleges differ in who enrolls; none of these coefficients is a causal effect.",
        "residualStd": float(np.sqrt(model.scale)),
    }
