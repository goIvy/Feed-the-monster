import { FEDERAL_TAX, FICA, STATE_STANDARD_DEDUCTION } from "./constants";

/**
 * Federal income tax on taxable income. `scale` indexes the brackets for
 * inflation so a projection 10 years out is not pushed into higher brackets
 * by price growth alone.
 */
export function federalIncomeTax(taxableIncome: number, scale = 1): number {
  let remaining = Math.max(0, taxableIncome);
  let lower = 0;
  let tax = 0;
  for (const { upTo, rate } of FEDERAL_TAX.brackets) {
    const top = upTo * scale;
    const slice = Math.min(remaining, top - lower);
    if (slice <= 0) break;
    tax += slice * rate;
    remaining -= slice;
    lower = top;
  }
  return tax;
}

export function federalMarginalRate(taxableIncome: number, scale = 1): number {
  for (const { upTo, rate } of FEDERAL_TAX.brackets) {
    if (taxableIncome <= upTo * scale) return rate;
  }
  return FEDERAL_TAX.brackets[FEDERAL_TAX.brackets.length - 1].rate;
}

export function ficaTax(gross: number, scale = 1): number {
  const ss = Math.min(gross, FICA.socialSecurityWageBase * scale) * FICA.socialSecurityRate;
  const medicare = gross * FICA.medicareRate;
  const extra = Math.max(0, gross - FICA.additionalMedicareThreshold * scale) * FICA.additionalMedicareRate;
  return ss + medicare + extra;
}

export interface TaxInput {
  gross: number;
  pretaxRetirement?: number;
  stateRate: number;
  localRate?: number;
  scale?: number;
  /** Extra percentage points of tax, used by "what if taxes rise" scenarios. */
  adjustment?: number;
}

export interface TaxBreakdown {
  federal: number;
  fica: number;
  state: number;
  local: number;
  total: number;
  /** Gross minus taxes and pre-tax retirement contributions. */
  takeHome: number;
  effectiveRate: number;
  marginalRate: number;
}

export function computeTaxes({
  gross,
  pretaxRetirement = 0,
  stateRate,
  localRate = 0,
  scale = 1,
  adjustment = 0,
}: TaxInput): TaxBreakdown {
  if (gross <= 0) {
    return { federal: 0, fica: 0, state: 0, local: 0, total: 0, takeHome: 0, effectiveRate: 0, marginalRate: 0 };
  }
  const retirement = Math.min(Math.max(0, pretaxRetirement), gross);
  const federalTaxable = gross - retirement - FEDERAL_TAX.standardDeduction * scale;
  const federal = federalIncomeTax(federalTaxable, scale);
  const fica = ficaTax(gross, scale);
  const state = Math.max(0, gross - retirement - STATE_STANDARD_DEDUCTION * scale) * stateRate;
  const local = gross * localRate;
  const total = federal + fica + state + local + gross * adjustment;
  return {
    federal,
    fica,
    state,
    local,
    total,
    takeHome: gross - total - retirement,
    effectiveRate: total / gross,
    marginalRate: federalMarginalRate(federalTaxable, scale) + stateRate + localRate + 0.0765 + adjustment,
  };
}
