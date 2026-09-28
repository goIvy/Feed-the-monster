/**
 * Model constants. Every value here is documented on /methodology and can be
 * overridden through Assumptions where it represents a user choice.
 */

/** 2025 federal brackets, single filer (IRS Rev. Proc. 2024-40 as amended by P.L. 119-21). */
export const FEDERAL_TAX = {
  standardDeduction: 15_750,
  brackets: [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
} as const;

export const FICA = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 176_100,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: 200_000,
} as const;

/** Simplified state deduction applied before the state's effective rate. */
export const STATE_STANDARD_DEDUCTION = 5_000;

/** Reference points used to scale national profiles to a college and a city. */
export const NATIONAL = {
  /** Median of institution-level 10-year earnings across four-year colleges. */
  collegeMedianEarnings10yr: 62_000,
  /** BLS OEWS all-occupation mean wage. */
  meanWage: 67_920,
} as const;

/** Elasticities are below 1 because part of the raw gap reflects who enrolls or moves, not the place itself. */
export const ELASTICITY = {
  college: 0.35,
  cityWage: 0.5,
  /** Share of the RPP gap that shows up in non-housing prices. */
  nonHousingPrice: 0.5,
} as const;

export const COLLEGE_FACTOR_BOUNDS = { min: 0.85, max: 1.25 } as const;

/** Monthly non-housing spending for a single adult at national-average prices (today's dollars). */
export const LIVING_BASELINE = {
  groceries: 420,
  utilities: 190,
  healthcare: 240,
  personal: 420,
} as const;

/** Earnings profile for the no-degree counterfactual (high school diploma, national, today's dollars). */
export const HIGH_SCHOOL_PROFILE = { start: 34_000, mid: 48_000 } as const;

/** Shape of the earnings curve: approach to mid-career over PEAK years with time constant K. */
export const CURVE = { k: 6, peakYear: 15, lateRealGrowth: 0.005 } as const;

/** Ratio of mid-career to starting salary used when only institution-level earnings are known. */
export const INSTITUTION_MID_RATIO = 1.55;
/** Scorecard measures earnings 10 years after entry, i.e. about 6 years after a 4-year graduation. */
export const SCORECARD_MEASURE_YEAR = 6;

/** Premium over published net price that out-of-state students at public colleges typically pay. */
export const OUT_OF_STATE_PASS_THROUGH = 0.9;

export const BASE_YEAR = 2026;
