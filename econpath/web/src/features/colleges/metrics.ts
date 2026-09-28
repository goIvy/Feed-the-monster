import { simulatePath, type Residency } from "@/lib/engine";
import { buildPathInput, cityForCollege, colleges } from "@/services/catalog";
import type { College } from "@/types/data";

export interface CollegeLens {
  majorId: string | null;
  residency: Residency;
}

export interface CollegeMetrics {
  college: College;
  netPrice: number;
  totalCost: number;
  debt: number;
  monthlyPayment: number;
  startingSalary: number;
  earnings5: number;
  earnings10: number;
  earnings20: number;
  breakevenAge: number | null;
  npv: number;
  roi: number;
  rpp: number;
  adjustedSalary: number;
  metroName: string;
}

export function collegeMetrics(college: College, lens: CollegeLens): CollegeMetrics {
  const r = simulatePath(buildPathInput({ collegeId: college.id, majorId: lens.majorId, residency: lens.residency }));
  const city = cityForCollege(college);
  const s = r.summary;
  return {
    college,
    netPrice: s.annualNetPrice,
    totalCost: s.totalCollegeCost,
    debt: s.debtAtGraduation,
    monthlyPayment: s.monthlyLoanPayment,
    startingSalary: s.startingSalaryToday,
    earnings5: s.earnings5,
    earnings10: s.earnings10,
    earnings20: s.earnings20,
    breakevenAge: s.breakevenAge,
    npv: s.netPresentValue,
    roi: s.roi,
    rpp: city.rpp,
    adjustedSalary: s.adjustedStartingSalary,
    metroName: `${city.name}, ${city.state}`,
  };
}

export function allCollegeMetrics(lens: CollegeLens): CollegeMetrics[] {
  return colleges.map((c) => collegeMetrics(c, lens));
}

/** Percentile rank (0–100) of `value` among `pool`; `higherIsBetter` flips the direction. */
export function percentile(value: number, pool: number[], higherIsBetter = true): number {
  if (pool.length <= 1) return 50;
  const below = pool.filter((v) => (higherIsBetter ? v < value : v > value)).length;
  const equal = pool.filter((v) => v === value).length;
  return Math.round(((below + (equal - 1) / 2) / (pool.length - 1)) * 100);
}
