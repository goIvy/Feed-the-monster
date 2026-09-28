import pytest

from app.engine.loans import monthly_payment
from app.engine.path import Assumptions, GradSchool, simulate_path, typical_loan_share
from app.engine.profile import career_curve
from app.engine.tax import compute_taxes, federal_income_tax, fica_tax
from app.engine.translate import equivalent_salary


def test_federal_brackets():
    assert federal_income_tax(0) == 0
    assert federal_income_tax(11_925) == pytest.approx(1_192.5)
    assert federal_income_tax(44_250) == pytest.approx(1_192.5 + (44_250 - 11_925) * 0.12)
    assert federal_income_tax(88_500, 2) == pytest.approx(2 * federal_income_tax(44_250))


def test_fica_wage_base():
    assert fica_tax(50_000) == pytest.approx(3_825)
    assert fica_tax(300_000) == pytest.approx(176_100 * 0.062 + 300_000 * 0.0145 + 100_000 * 0.009)


def test_combined_taxes():
    t = compute_taxes(60_000, state_rate=0)
    assert t.federal == pytest.approx(5_071.5)
    assert t.take_home == pytest.approx(60_000 - 9_661.5)
    assert compute_taxes(0, 0.05).total == 0


def test_loan_payment():
    assert monthly_payment(10_000, 0.06, 10) == pytest.approx(111.02, abs=0.01)
    assert monthly_payment(12_000, 0, 10) == pytest.approx(100)


def test_curve_endpoints():
    assert career_curve(50_000, 80_000, 0) == pytest.approx(50_000)
    assert career_curve(50_000, 80_000, 15) == pytest.approx(80_000)
    assert career_curve(50_000, 80_000, 20) > 80_000


def test_path_invariants(catalog):
    inp = catalog.path_input("ucla", major_id="economics")
    r = simulate_path(inp)
    assert r.rows[0].age == 18 and r.rows[-1].age == 40
    assert sum(1 for row in r.rows if row.phase == "college") == 4
    share = typical_loan_share(catalog.colleges["ucla"])
    assert r.summary.total_college_cost * share < r.summary.debt_at_graduation < r.summary.total_college_cost * share * 1.3
    for row in r.rows:
        assert row.net_worth == pytest.approx(row.assets - row.debt_balance)


def test_scenarios_move_in_the_right_direction(catalog):
    inp = catalog.path_input("ucla", major_id="economics")
    base = simulate_path(inp).summary
    aided = simulate_path(inp, Assumptions(scholarship_per_year=5_000)).summary
    assert aided.debt_at_graduation < base.debt_at_graduation
    assert simulate_path(inp, Assumptions(family_contribution_per_year=100_000)).summary.debt_at_graduation == 0
    grad = simulate_path(inp, Assumptions(grad_school=GradSchool(2, 30_000, 0.2))).summary
    assert grad.graduation_age == 24
    assert grad.starting_salary_today == pytest.approx(base.starting_salary_today * 1.2)


def test_translator(catalog):
    sf, austin = catalog.cities["san-francisco"], catalog.cities["austin"]
    r_sf, r_au = catalog.state_tax_rate("CA"), catalog.state_tax_rate("TX")
    assert equivalent_salary(100_000, austin, r_au, austin, r_au) == pytest.approx(100_000, abs=1)
    eq = equivalent_salary(120_000, sf, r_sf, austin, r_au)
    assert eq < 100_000
    assert equivalent_salary(eq, austin, r_au, sf, r_sf) == pytest.approx(120_000, abs=1)
