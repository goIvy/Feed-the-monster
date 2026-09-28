"""The Python engine must reproduce the TypeScript engine's committed fixture."""

import json
from pathlib import Path

import pytest

from app.api.schemas import AssumptionsIn, PathSelection
from app.domain import to_camel
from app.engine.path import simulate_path

FIXTURES = Path(__file__).resolve().parents[2] / "data" / "fixtures"
CASES = json.loads((FIXTURES / "engine-parity.cases.json").read_text())
EXPECTED = json.loads((FIXTURES / "engine-parity.expected.json").read_text())


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_matches_typescript(case, catalog):
    sel = PathSelection.model_validate(case["path"])
    assumptions = AssumptionsIn.model_validate(case["assumptions"]).to_engine()
    r = simulate_path(catalog.path_input(sel.college_id, sel.major_id, sel.occupation_id, sel.city_id, sel.residency), assumptions)
    expected = EXPECTED[case["name"]]
    actual = {to_camel(k): v for k, v in vars(r.summary).items()}
    for key, value in expected["summary"].items():
        if isinstance(value, float | int) and not isinstance(value, bool) and value is not None:
            assert actual[key] == pytest.approx(value, rel=1e-9, abs=1e-6), key
        else:
            assert actual[key] == value, key
    assert [row.net_worth for row in r.rows] == pytest.approx(expected["netWorth"], rel=1e-9, abs=1e-6)
    assert [row.gross for row in r.rows] == pytest.approx(expected["gross"], rel=1e-9, abs=1e-6)
