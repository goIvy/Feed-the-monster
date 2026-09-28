import type { City, College, Major, Occupation } from "@/types/data";
import {
  COLLEGE_FACTOR_BOUNDS,
  CURVE,
  ELASTICITY,
  INSTITUTION_MID_RATIO,
  LIVING_BASELINE,
  NATIONAL,
  SCORECARD_MEASURE_YEAR,
} from "./constants";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Real (today's dollars) salary `t` years after the first full-time job. */
export function careerCurve(start: number, mid: number, t: number): number {
  const { k, peakYear, lateRealGrowth } = CURVE;
  if (t <= peakYear) {
    const progress = (1 - Math.exp(-t / k)) / (1 - Math.exp(-peakYear / k));
    return start + (mid - start) * progress;
  }
  return mid * Math.pow(1 + lateRealGrowth, t - peakYear);
}

/** Attenuated earnings premium of a college relative to the typical four-year college. */
export function collegeFactor(college: Pick<College, "medianEarnings10yr">): number {
  const raw = Math.pow(college.medianEarnings10yr / NATIONAL.collegeMedianEarnings10yr, ELASTICITY.college);
  return clamp(raw, COLLEGE_FACTOR_BOUNDS.min, COLLEGE_FACTOR_BOUNDS.max);
}

/** Attenuated local wage level relative to the national mean wage. */
export function cityWageFactor(city: Pick<City, "meanWage">): number {
  return Math.pow(city.meanWage / NATIONAL.meanWage, ELASTICITY.cityWage);
}

/** Non-housing price index: half of the RPP gap is assumed to fall outside housing. */
export function nonHousingPriceIndex(city: Pick<City, "rpp">): number {
  return 1 + (city.rpp / 100 - 1) * ELASTICITY.nonHousingPrice;
}

export interface MonthlyLiving {
  groceries: number;
  utilities: number;
  healthcare: number;
  transportation: number;
  personal: number;
  total: number;
}

/** Monthly non-housing costs in a city, in today's dollars. */
export function monthlyLiving(city: Pick<City, "rpp" | "transportMonthly">): MonthlyLiving {
  const npi = nonHousingPriceIndex(city);
  const groceries = LIVING_BASELINE.groceries * npi;
  const utilities = LIVING_BASELINE.utilities * npi;
  const healthcare = LIVING_BASELINE.healthcare * (0.5 + 0.5 * npi);
  const personal = LIVING_BASELINE.personal * npi;
  const transportation = city.transportMonthly;
  return {
    groceries,
    utilities,
    healthcare,
    transportation,
    personal,
    total: groceries + utilities + healthcare + personal + transportation,
  };
}

export type ProfileSource = "career" | "major" | "institution";

export interface EarningsProfile {
  /** Starting salary in today's dollars, after college and city adjustments. */
  start: number;
  /** Salary at year 15 in today's dollars. */
  mid: number;
  source: ProfileSource;
  collegeFactor: number;
  cityFactor: number;
}

export interface ProfileInput {
  college: College;
  collegeCity: City;
  city: City;
  major?: Major | null;
  occupation?: Occupation | null;
}

/**
 * Earnings profile for a path. Priority: a chosen career (BLS wage
 * distribution), then a chosen major (early/mid-career medians), then the
 * college's own Scorecard earnings.
 */
export function resolveProfile({ college, collegeCity, city, major, occupation }: ProfileInput): EarningsProfile {
  const cf = collegeFactor(college);
  const lf = cityWageFactor(city);

  if (occupation) {
    const start = occupation.p10Wage + 0.35 * (occupation.medianWage - occupation.p10Wage);
    const mid = occupation.medianWage + 0.35 * (occupation.p90Wage - occupation.medianWage);
    return { start: start * cf * lf, mid: mid * cf * lf, source: "career", collegeFactor: cf, cityFactor: lf };
  }
  if (major) {
    return {
      start: major.startSalary * cf * lf,
      mid: major.midCareerSalary * cf * lf,
      source: "major",
      collegeFactor: cf,
      cityFactor: lf,
    };
  }
  // Scorecard earnings already include the college effect and the home region's wages;
  // move them from the college's metro to the destination city.
  const relocation = lf / cityWageFactor(collegeCity);
  const shape = careerCurve(1, INSTITUTION_MID_RATIO, SCORECARD_MEASURE_YEAR);
  const start = (college.medianEarnings10yr / shape) * relocation;
  return { start, mid: start * INSTITUTION_MID_RATIO, source: "institution", collegeFactor: 1, cityFactor: relocation };
}
