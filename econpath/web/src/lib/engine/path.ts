import type { City, College, Major, Occupation } from "@/types/data";
import { BASE_YEAR, HIGH_SCHOOL_PROFILE, OUT_OF_STATE_PASS_THROUGH } from "./constants";
import { monthlyPayment } from "./loans";
import { careerCurve, cityWageFactor, monthlyLiving, resolveProfile, type EarningsProfile } from "./profile";
import { computeTaxes } from "./tax";

export type Residency = "in-state" | "out-of-state";

export interface GradSchool {
  years: number;
  /** Net annual cost in today's dollars, fully financed with loans. */
  annualCost: number;
  /** Multiplier on the earnings profile after completion, e.g. 0.2 = +20%. */
  salaryPremium: number;
}

export interface Assumptions {
  /** Consumer price inflation (also applied to nominal wages and rent). */
  inflation: number;
  /** Annual growth of college prices while enrolled. */
  tuitionInflation: number;
  loanRate: number;
  loanTermYears: number;
  /** Real discount rate for present values. */
  discountRate: number;
  startAge: number;
  horizonAge: number;
  yearsInSchool: number;
  /** Fractional changes: 0.2 = +20%. */
  tuitionChange: number;
  rentChange: number;
  salaryChange: number;
  /** Extra grants/scholarships per year beyond the college's typical aid, today's dollars. */
  scholarshipPerYear: number;
  /** Family and savings contribution per year; null uses the college's typical borrowing share. */
  familyContributionPerYear: number | null;
  /** Total planned borrowing for the degree; overrides the contribution and typical share when set. */
  borrowingTotal: number | null;
  /** Expected annual grant aid; when set, net price = cost of attendance − this aid. */
  grantAidOverride: number | null;
  /** Monthly rent override in today's dollars; null uses the city's median one-bedroom. */
  rentOverride: number | null;
  /** Starting salary override in today's dollars. */
  salaryOverride: number | null;
  livingWithFamilyYears: number;
  /** Share of a one-bedroom's rent paid; 0.65 approximates splitting a two-bedroom. */
  housingShare: number;
  /** Share of take-home pay saved, capped by what is left after costs. */
  savingsRate: number;
  /** Pre-tax retirement contribution as a share of gross pay. */
  retirementRate: number;
  investmentReturn: number;
  /** Extra effective tax rate, percentage points as a fraction. */
  taxChange: number;
  gradSchool: GradSchool | null;
  baseYear: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  inflation: 0.025,
  tuitionInflation: 0.03,
  loanRate: 0.0639,
  loanTermYears: 10,
  discountRate: 0.03,
  startAge: 18,
  horizonAge: 40,
  yearsInSchool: 4,
  tuitionChange: 0,
  rentChange: 0,
  salaryChange: 0,
  scholarshipPerYear: 0,
  familyContributionPerYear: null,
  borrowingTotal: null,
  grantAidOverride: null,
  rentOverride: null,
  salaryOverride: null,
  livingWithFamilyYears: 0,
  housingShare: 1,
  savingsRate: 0.1,
  retirementRate: 0.05,
  investmentReturn: 0.06,
  taxChange: 0,
  gradSchool: null,
  baseYear: BASE_YEAR,
};

export interface PathInput {
  college: College;
  collegeCity: City;
  city: City;
  major?: Major | null;
  occupation?: Occupation | null;
  residency?: Residency;
  /** Effective state income tax rate for the destination city's state. */
  stateTaxRate: number;
}

export type Phase = "college" | "grad-school" | "work";

export interface YearRow {
  index: number;
  calendarYear: number;
  age: number;
  phase: Phase;
  priceIndex: number;
  gross: number;
  taxes: number;
  retirement: number;
  takeHome: number;
  rent: number;
  living: number;
  loanPayment: number;
  interestPaid: number;
  disposable: number;
  savings: number;
  educationCost: number;
  newBorrowing: number;
  debtBalance: number;
  assets: number;
  netWorth: number;
  cumulativeEarnings: number;
  highSchoolGross: number;
  cumulativeHighSchool: number;
  /** Degree path earnings minus education costs and interest, minus the no-degree path, cumulative. */
  cumulativeNetGain: number;
}

export interface MonthlyBudget {
  gross: number;
  taxes: number;
  retirement: number;
  rent: number;
  living: number;
  loanPayment: number;
  savings: number;
  disposable: number;
}

export interface PathSummary {
  startingSalary: number;
  startingSalaryToday: number;
  salaryYear10: number;
  salaryYear10Today: number;
  annualNetPrice: number;
  totalCollegeCost: number;
  debtAtGraduation: number;
  monthlyLoanPayment: number;
  totalInterest: number;
  debtFreeAge: number | null;
  firstYearBudget: MonthlyBudget;
  monthlyDisposable: number;
  /** First-year take-home pay expressed at national-average prices, today's dollars. */
  purchasingPower: number;
  /** Starting salary at national-average prices, today's dollars. */
  adjustedStartingSalary: number;
  breakevenAge: number | null;
  breakevenYearsAfterEnrollment: number | null;
  earnings5: number;
  earnings10: number;
  earnings20: number;
  lifetimeEarnings: number;
  netPresentValue: number;
  roi: number;
  netWorthAtHorizon: number;
  graduationAge: number;
}

export interface PathResult {
  profile: EarningsProfile;
  rows: YearRow[];
  summary: PathSummary;
  assumptions: Assumptions;
}

/** Published net price for this student, today's dollars, before scenario changes. */
export function baseNetPrice(college: College, residency: Residency = "in-state"): number {
  if (college.control === "public" && residency === "out-of-state") {
    return college.avgNetPrice + (college.tuitionOutOfState - college.tuitionInState) * OUT_OF_STATE_PASS_THROUGH;
  }
  return college.avgNetPrice;
}

/** Sticker cost of attendance for this student, today's dollars. */
export function costOfAttendance(college: College, residency: Residency = "in-state"): number {
  if (college.control === "public" && residency === "out-of-state") {
    return college.costOfAttendance + (college.tuitionOutOfState - college.tuitionInState);
  }
  return college.costOfAttendance;
}

/** Share of net price a typical student borrows, implied by Scorecard median debt. */
export function typicalLoanShare(college: College, yearsInSchool = 4): number {
  if (college.avgNetPrice <= 0) return 0;
  return Math.min(0.9, Math.max(0, college.medianDebt / (yearsInSchool * college.avgNetPrice)));
}

export function simulatePath(input: PathInput, overrides: Partial<Assumptions> = {}): PathResult {
  const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, ...overrides };
  const { college, city, stateTaxRate } = input;
  const residency = input.residency ?? "in-state";

  const baseProfile = resolveProfile(input);
  const gradPremium = a.gradSchool ? 1 + a.gradSchool.salaryPremium : 1;
  const salaryScale = (1 + a.salaryChange) * gradPremium;
  let start = baseProfile.start * salaryScale;
  let mid = baseProfile.mid * salaryScale;
  if (a.salaryOverride != null && a.salaryOverride > 0) {
    mid = mid * (a.salaryOverride / start);
    start = a.salaryOverride;
  }
  const profile: EarningsProfile = { ...baseProfile, start, mid };

  const gradYears = a.gradSchool ? Math.max(0, Math.round(a.gradSchool.years)) : 0;
  const schoolYears = a.yearsInSchool + gradYears;
  const totalYears = Math.max(schoolYears + 1, a.horizonAge - a.startAge + 1);

  const priceBeforeChanges =
    a.grantAidOverride != null
      ? Math.max(0, costOfAttendance(college, residency) - a.grantAidOverride)
      : baseNetPrice(college, residency);
  const annualNet = Math.max(0, priceBeforeChanges * (1 + a.tuitionChange) - a.scholarshipPerYear);
  const loanShare = typicalLoanShare(college, a.yearsInSchool);
  const living = monthlyLiving(city);
  const baseRent = (a.rentOverride ?? city.medianRent1br * a.housingShare) * (1 + a.rentChange);
  const hsCityFactor = cityWageFactor(city);
  const nominalDiscount = (1 + a.discountRate) * (1 + a.inflation) - 1;

  const rows: YearRow[] = [];
  let debt = 0;
  let assets = 0;
  let annualLoanPayment = 0;
  let cumEarn = 0;
  let cumHs = 0;
  let cumGain = 0;
  let totalCollegeCost = 0;
  let totalInterest = 0;
  let debtAtGraduation = 0;
  let debtFreeAge: number | null = null;
  let npv = 0;
  let pvInvestment = 0;
  let breakevenIndex: number | null = null;

  for (let i = 0; i < totalYears; i++) {
    const age = a.startAge + i;
    const priceIndex = Math.pow(1 + a.inflation, i);
    const hsGross = careerCurve(HIGH_SCHOOL_PROFILE.start, HIGH_SCHOOL_PROFILE.mid, i) * hsCityFactor * priceIndex;
    const discount = Math.pow(1 + nominalDiscount, i);

    let phase: Phase = "work";
    let gross = 0;
    let educationCost = 0;
    let newBorrowing = 0;
    let interestPaid = 0;
    let loanPayment = 0;
    let rent = 0;
    let livingCost = 0;
    let taxes = 0;
    let retirement = 0;
    let takeHome = 0;
    let savings = 0;
    let disposable = 0;

    if (i < a.yearsInSchool) {
      phase = "college";
      educationCost = annualNet * Math.pow(1 + a.tuitionInflation, i);
      if (a.borrowingTotal != null) {
        newBorrowing = Math.min(educationCost, Math.max(0, a.borrowingTotal) / a.yearsInSchool);
      } else if (a.familyContributionPerYear != null) {
        newBorrowing = Math.max(0, educationCost - a.familyContributionPerYear * priceIndex);
      } else {
        newBorrowing = educationCost * loanShare;
      }
      totalCollegeCost += educationCost;
      debt = (debt + newBorrowing) * (1 + a.loanRate);
    } else if (i < schoolYears && a.gradSchool) {
      phase = "grad-school";
      educationCost = a.gradSchool.annualCost * Math.pow(1 + a.tuitionInflation, i);
      newBorrowing = educationCost;
      debt = (debt + newBorrowing) * (1 + a.loanRate);
    } else {
      const t = i - schoolYears;
      if (t === 0) {
        debtAtGraduation = debt;
        annualLoanPayment = monthlyPayment(debt, a.loanRate, a.loanTermYears) * 12;
        if (debt <= 0) debtFreeAge = age;
      }
      gross = careerCurve(profile.start, profile.mid, t) * priceIndex;
      retirement = gross * a.retirementRate;
      const tax = computeTaxes({
        gross,
        pretaxRetirement: retirement,
        stateRate: stateTaxRate,
        localRate: city.localIncomeTaxRate,
        scale: priceIndex,
        adjustment: a.taxChange,
      });
      taxes = tax.total;
      takeHome = tax.takeHome;

      if (debt > 0) {
        interestPaid = debt * a.loanRate;
        loanPayment = Math.min(annualLoanPayment, debt + interestPaid);
        debt = debt + interestPaid - loanPayment;
        if (debt < 1) {
          debt = 0;
          debtFreeAge = age;
        }
      }

      const atHome = t < a.livingWithFamilyYears;
      rent = atHome ? 0 : baseRent * 12 * priceIndex;
      livingCost = living.total * 12 * priceIndex * (atHome ? 0.6 : 1);
      disposable = takeHome - rent - livingCost - loanPayment;
      savings = Math.max(0, Math.min(takeHome * a.savingsRate, disposable));
      totalInterest += interestPaid;
    }

    assets = assets * (1 + a.investmentReturn) + retirement + (disposable < 0 ? disposable : savings);
    cumEarn += gross;
    cumHs += hsGross;
    const flow = gross - educationCost - interestPaid - hsGross;
    cumGain += flow;
    npv += flow / discount;
    if (phase !== "work") pvInvestment += (educationCost + hsGross) / discount;
    if (breakevenIndex == null && phase === "work" && cumGain >= 0) breakevenIndex = i;

    rows.push({
      index: i,
      calendarYear: a.baseYear + i,
      age,
      phase,
      priceIndex,
      gross,
      taxes,
      retirement,
      takeHome,
      rent,
      living: livingCost,
      loanPayment,
      interestPaid,
      disposable,
      savings,
      educationCost,
      newBorrowing,
      debtBalance: debt,
      assets,
      netWorth: assets - debt,
      cumulativeEarnings: cumEarn,
      highSchoolGross: hsGross,
      cumulativeHighSchool: cumHs,
      cumulativeNetGain: cumGain,
    });
  }

  const work = rows.filter((r) => r.phase === "work");
  const first = work[0];
  const sumFirst = (n: number) => work.slice(0, n).reduce((s, r) => s + r.gross, 0);
  const year10 = work[Math.min(9, work.length - 1)];
  const last = rows[rows.length - 1];

  const firstYearBudget: MonthlyBudget = {
    gross: first.gross / 12,
    taxes: first.taxes / 12,
    retirement: first.retirement / 12,
    rent: first.rent / 12,
    living: first.living / 12,
    loanPayment: first.loanPayment / 12,
    savings: first.savings / 12,
    disposable: first.disposable / 12,
  };

  const rppFactor = city.rpp / 100;

  return {
    profile,
    rows,
    assumptions: a,
    summary: {
      startingSalary: first.gross,
      startingSalaryToday: first.gross / first.priceIndex,
      salaryYear10: year10.gross,
      salaryYear10Today: year10.gross / year10.priceIndex,
      annualNetPrice: annualNet,
      totalCollegeCost,
      debtAtGraduation,
      monthlyLoanPayment: annualLoanPayment / 12,
      totalInterest,
      debtFreeAge,
      firstYearBudget,
      monthlyDisposable: first.disposable / 12,
      purchasingPower: first.takeHome / first.priceIndex / rppFactor,
      adjustedStartingSalary: first.gross / first.priceIndex / rppFactor,
      breakevenAge: breakevenIndex == null ? null : a.startAge + breakevenIndex,
      breakevenYearsAfterEnrollment: breakevenIndex == null ? null : breakevenIndex + 1,
      earnings5: sumFirst(5),
      earnings10: sumFirst(10),
      earnings20: sumFirst(20),
      lifetimeEarnings: cumEarn,
      netPresentValue: npv,
      roi: pvInvestment > 0 ? npv / pvInvestment : 0,
      netWorthAtHorizon: last.netWorth,
      graduationAge: a.startAge + schoolYears,
    },
  };
}
