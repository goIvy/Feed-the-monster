import warnings

import pytest

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["counts"]["colleges"] == 55


def test_colleges_filter_and_sort():
    rows = client.get("/v1/colleges", params={"control": "public", "sort": "net_price", "limit": 5}).json()
    assert len(rows) == 5
    assert all(r["college"]["control"] == "public" for r in rows)
    prices = [r["netPrice"] for r in rows]
    assert prices == sorted(prices)


def test_compare_and_404():
    rows = client.get("/v1/colleges/compare", params={"ids": "ucla,usc"}).json()
    assert [r["college"]["id"] for r in rows] == ["ucla", "usc"]
    assert client.get("/v1/colleges/nope").status_code == 404


def test_simulate_validates_input():
    ok = client.post("/v1/simulate", json={"paths": [{"collegeId": "ucla", "majorId": "economics"}], "assumptions": {"inflation": 0.04}})
    assert ok.status_code == 200
    result = ok.json()["results"][0]
    assert len(result["rows"]) == 23
    assert result["summary"]["breakevenAge"] >= 22
    bad = client.post("/v1/simulate", json={"paths": [{"collegeId": "ucla"}], "assumptions": {"inflation": 5}})
    assert bad.status_code == 422
    missing = client.post("/v1/simulate", json={"paths": [{"collegeId": "hogwarts"}]})
    assert missing.status_code == 404


def test_translate():
    body = client.get("/v1/translate", params={"salary": 120000, "from": "san-francisco", "to": "austin"}).json()
    assert body["results"][0]["equivalentSalary"] == pytest.approx(88_000, rel=0.05)


def test_research_model_toggles_covariates():
    full = client.get("/v1/research/roi-model").json()
    small = client.get("/v1/research/roi-model", params={"covariates": "grad_rate"}).json()
    assert full["n"] == small["n"] == 55
    assert {c["term"] for c in small["coefficients"]} == {"Intercept", "grad_rate"}
    assert "causal" in full["caveat"]
    assert client.get("/v1/research/roi-model", params={"covariates": "astrology"}).status_code == 422
