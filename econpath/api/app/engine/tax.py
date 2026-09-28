from dataclasses import dataclass

from . import constants as c


def federal_income_tax(taxable_income: float, scale: float = 1.0) -> float:
    remaining = max(0.0, taxable_income)
    lower = 0.0
    tax = 0.0
    for up_to, rate in c.FEDERAL_BRACKETS:
        top = up_to * scale
        slice_ = min(remaining, top - lower)
        if slice_ <= 0:
            break
        tax += slice_ * rate
        remaining -= slice_
        lower = top
    return tax


def federal_marginal_rate(taxable_income: float, scale: float = 1.0) -> float:
    for up_to, rate in c.FEDERAL_BRACKETS:
        if taxable_income <= up_to * scale:
            return rate
    return c.FEDERAL_BRACKETS[-1][1]


def fica_tax(gross: float, scale: float = 1.0) -> float:
    ss = min(gross, c.SOCIAL_SECURITY_WAGE_BASE * scale) * c.SOCIAL_SECURITY_RATE
    medicare = gross * c.MEDICARE_RATE
    extra = max(0.0, gross - c.ADDITIONAL_MEDICARE_THRESHOLD * scale) * c.ADDITIONAL_MEDICARE_RATE
    return ss + medicare + extra


@dataclass(frozen=True)
class TaxBreakdown:
    federal: float
    fica: float
    state: float
    local: float
    total: float
    take_home: float
    effective_rate: float
    marginal_rate: float


def compute_taxes(
    gross: float,
    state_rate: float,
    pretax_retirement: float = 0.0,
    local_rate: float = 0.0,
    scale: float = 1.0,
    adjustment: float = 0.0,
) -> TaxBreakdown:
    if gross <= 0:
        return TaxBreakdown(0, 0, 0, 0, 0, 0, 0, 0)
    retirement = min(max(0.0, pretax_retirement), gross)
    federal_taxable = gross - retirement - c.FEDERAL_STANDARD_DEDUCTION * scale
    federal = federal_income_tax(federal_taxable, scale)
    fica = fica_tax(gross, scale)
    state = max(0.0, gross - retirement - c.STATE_STANDARD_DEDUCTION * scale) * state_rate
    local = gross * local_rate
    total = federal + fica + state + local + gross * adjustment
    return TaxBreakdown(
        federal=federal,
        fica=fica,
        state=state,
        local=local,
        total=total,
        take_home=gross - total - retirement,
        effective_rate=total / gross,
        marginal_rate=federal_marginal_rate(federal_taxable, scale) + state_rate + local_rate + 0.0765 + adjustment,
    )
