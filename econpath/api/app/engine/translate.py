from app.domain import City

from .profile import monthly_living_total
from .tax import compute_taxes


def real_take_home(salary: float, city: City, state_tax_rate: float) -> float:
    take_home = compute_taxes(salary, state_tax_rate, local_rate=city.local_income_tax_rate).take_home
    return take_home / (city.rpp / 100)


def equivalent_salary(salary: float, src: City, src_rate: float, dst: City, dst_rate: float) -> float:
    """Salary in `dst` with the same after-tax purchasing power as `salary` in `src` (bisection)."""
    target = real_take_home(salary, src, src_rate)
    lo, hi = 0.0, max(salary * 4, 50_000.0)
    for _ in range(60):
        mid = (lo + hi) / 2
        if real_take_home(mid, dst, dst_rate) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def monthly_leftover(salary: float, city: City, state_tax_rate: float) -> float:
    take_home = compute_taxes(salary, state_tax_rate, local_rate=city.local_income_tax_rate).take_home
    return take_home / 12 - city.median_rent_1br - monthly_living_total(city)
