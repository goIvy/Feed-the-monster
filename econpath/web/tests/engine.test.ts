import { describe, expect, it } from "vitest";
import {
  amortize,
  careerCurve,
  computeTaxes,
  equivalentSalary,
  federalIncomeTax,
  ficaTax,
  monthlyPayment,
  simulatePath,
  typicalLoanShare,
} from "@/lib/engine";
import { buildPathInput, getCity, getCollege, stateTaxRate } from "@/services/catalog";

describe("taxes", () => {
  it("applies 2025 single-filer brackets", () => {
    expect(federalIncomeTax(0)).toBe(0);
    expect(federalIncomeTax(11_925)).toBeCloseTo(1_192.5, 2);
    expect(federalIncomeTax(44_250)).toBeCloseTo(1_192.5 + (44_250 - 11_925) * 0.12, 2);
  });

  it("indexes brackets with the price scale", () => {
    expect(federalIncomeTax(88_500, 2)).toBeCloseTo(2 * federalIncomeTax(44_250), 2);
  });

  it("caps Social Security at the wage base", () => {
    expect(ficaTax(50_000)).toBeCloseTo(3_825, 2);
    expect(ficaTax(300_000)).toBeCloseTo(176_100 * 0.062 + 300_000 * 0.0145 + 100_000 * 0.009, 2);
  });

  it("combines federal, FICA, state and local tax", () => {
    const t = computeTaxes({ gross: 60_000, stateRate: 0 });
    expect(t.federal).toBeCloseTo(5_071.5, 1);
    expect(t.fica).toBeCloseTo(4_590, 1);
    expect(t.takeHome).toBeCloseTo(60_000 - 9_661.5, 1);

    const withState = computeTaxes({ gross: 60_000, stateRate: 0.05, localRate: 0.01 });
    expect(withState.state).toBeCloseTo(55_000 * 0.05, 1);
    expect(withState.local).toBeCloseTo(600, 1);
  });

  it("reduces federal taxable income by pre-tax retirement", () => {
    const base = computeTaxes({ gross: 80_000, stateRate: 0 });
    const saver = computeTaxes({ gross: 80_000, stateRate: 0, pretaxRetirement: 8_000 });
    expect(saver.federal).toBeLessThan(base.federal);
    expect(saver.takeHome).toBeLessThan(base.takeHome);
  });

  it("returns zeros for no income", () => {
    expect(computeTaxes({ gross: 0, stateRate: 0.05 }).total).toBe(0);
  });
});

describe("loans", () => {
  it("matches the standard amortization formula", () => {
    expect(monthlyPayment(10_000, 0.06, 10)).toBeCloseTo(111.02, 2);
    expect(monthlyPayment(12_000, 0, 10)).toBeCloseTo(100, 6);
    expect(monthlyPayment(0, 0.06, 10)).toBe(0);
  });

  it("retires the balance on schedule and faster with extra payments", () => {
    const base = amortize(30_000, 0.0639, 10);
    expect(base.months).toBe(120);
    expect(base.years.at(-1)?.balance).toBeCloseTo(0, 2);
    expect(base.totalPaid).toBeCloseTo(base.monthlyPayment * 120, 0);
    const fast = amortize(30_000, 0.0639, 10, 200);
    expect(fast.months).toBeLessThan(120);
    expect(fast.totalInterest).toBeLessThan(base.totalInterest);
  });
});

describe("earnings curve", () => {
  it("starts at start, reaches mid at year 15, then grows slowly", () => {
    expect(careerCurve(50_000, 80_000, 0)).toBeCloseTo(50_000, 6);
    expect(careerCurve(50_000, 80_000, 15)).toBeCloseTo(80_000, 6);
    expect(careerCurve(50_000, 80_000, 20)).toBeGreaterThan(80_000);
    expect(careerCurve(50_000, 80_000, 5)).toBeGreaterThan(careerCurve(50_000, 80_000, 4));
  });
});

describe("simulatePath", () => {
  const ucla = buildPathInput({ collegeId: "ucla", majorId: "economics" });

  it("produces one row per year from 18 to 40", () => {
    const { rows, summary } = simulatePath(ucla);
    expect(rows[0].age).toBe(18);
    expect(rows.at(-1)?.age).toBe(40);
    expect(rows.filter((r) => r.phase === "college")).toHaveLength(4);
    expect(summary.graduationAge).toBe(22);
  });

  it("borrows the college's typical share and accrues interest in school", () => {
    const college = getCollege("ucla")!;
    const { summary } = simulatePath(ucla);
    const share = typicalLoanShare(college);
    expect(summary.debtAtGraduation).toBeGreaterThan(summary.totalCollegeCost * share);
    expect(summary.debtAtGraduation).toBeLessThan(summary.totalCollegeCost * share * 1.3);
  });

  it("scholarships lower debt and bring breakeven earlier or equal", () => {
    const base = simulatePath(ucla).summary;
    const aided = simulatePath(ucla, { scholarshipPerYear: 5_000 }).summary;
    expect(aided.debtAtGraduation).toBeLessThan(base.debtAtGraduation);
    expect(aided.totalCollegeCost).toBeLessThan(base.totalCollegeCost);
    expect(aided.breakevenAge!).toBeLessThanOrEqual(base.breakevenAge!);
  });

  it("full family contribution means no debt", () => {
    const { summary } = simulatePath(ucla, { familyContributionPerYear: 100_000 });
    expect(summary.debtAtGraduation).toBe(0);
    expect(summary.monthlyLoanPayment).toBe(0);
    expect(summary.debtFreeAge).toBe(22);
  });

  it("planned borrowing overrides the typical share", () => {
    const { summary } = simulatePath(ucla, { borrowingTotal: 20_000 });
    // 5,000 a year, each accruing interest until graduation.
    const r = 0.0639;
    const expected = [4, 3, 2, 1].reduce((s, n) => s + 5_000 * Math.pow(1 + r, n), 0);
    expect(summary.debtAtGraduation).toBeCloseTo(expected, 2);
  });

  it("explicit grant aid prices from the cost of attendance", () => {
    const college = getCollege("ucla")!;
    const { summary } = simulatePath(ucla, { grantAidOverride: 30_000 });
    expect(summary.annualNetPrice).toBeCloseTo(college.costOfAttendance - 30_000, 6);
  });

  it("repays loans within the term", () => {
    const { summary } = simulatePath(ucla);
    expect(summary.debtFreeAge).toBe(22 + 10);
  });

  it("higher rent lowers disposable income one-for-one after tax", () => {
    const base = simulatePath(ucla).summary;
    const pricier = simulatePath(ucla, { rentChange: 0.1 }).summary;
    const rent = getCity("los-angeles")!.medianRent1br;
    const inflation = Math.pow(1.025, 4);
    expect(base.monthlyDisposable - pricier.monthlyDisposable).toBeCloseTo(rent * 0.1 * inflation, 4);
  });

  it("a salary override pins the starting salary in today's dollars", () => {
    const { summary } = simulatePath(ucla, { salaryOverride: 70_000 });
    expect(summary.startingSalaryToday).toBeCloseTo(70_000, 4);
  });

  it("graduate school delays work and adds debt", () => {
    const base = simulatePath(ucla).summary;
    const grad = simulatePath(ucla, { gradSchool: { years: 2, annualCost: 30_000, salaryPremium: 0.2 } }).summary;
    expect(grad.graduationAge).toBe(24);
    expect(grad.debtAtGraduation).toBeGreaterThan(base.debtAtGraduation + 60_000);
    expect(grad.startingSalaryToday).toBeCloseTo(base.startingSalaryToday * 1.2, 4);
  });

  it("out-of-state residency raises public college cost", () => {
    const inState = simulatePath(ucla).summary;
    const outState = simulatePath({ ...ucla, residency: "out-of-state" }).summary;
    expect(outState.annualNetPrice).toBeGreaterThan(inState.annualNetPrice + 25_000);
  });

  it("uses a career's wage distribution when a career is chosen", () => {
    const career = simulatePath(buildPathInput({ collegeId: "ucla", majorId: "economics", occupationId: "software-developer" }));
    const major = simulatePath(ucla);
    expect(career.profile.source).toBe("career");
    expect(career.summary.startingSalary).toBeGreaterThan(major.summary.startingSalary);
  });

  it("falls back to institution earnings without a major", () => {
    const { profile, rows } = simulatePath(buildPathInput({ collegeId: "ucla" }));
    expect(profile.source).toBe("institution");
    const year6 = rows.find((r) => r.index === 4 + 6)!;
    expect(year6.gross / year6.priceIndex).toBeCloseTo(getCollege("ucla")!.medianEarnings10yr, 0);
  });

  it("keeps rows internally consistent", () => {
    for (const r of simulatePath(ucla).rows) {
      expect(r.netWorth).toBeCloseTo(r.assets - r.debtBalance, 6);
      if (r.phase === "work") {
        expect(r.disposable).toBeCloseTo(r.takeHome - r.rent - r.living - r.loanPayment, 6);
        expect(r.savings).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("salary translator", () => {
  const ctx = (id: string) => {
    const city = getCity(id)!;
    return { city, stateTaxRate: stateTaxRate(city.state) };
  };

  it("is the identity within one city", () => {
    expect(equivalentSalary(100_000, ctx("austin"), ctx("austin"))).toBeCloseTo(100_000, 0);
  });

  it("needs less in cheaper, lower-tax cities", () => {
    const austin = equivalentSalary(120_000, ctx("san-francisco"), ctx("austin"));
    expect(austin).toBeLessThan(100_000);
    const back = equivalentSalary(austin, ctx("austin"), ctx("san-francisco"));
    expect(back).toBeCloseTo(120_000, 0);
  });
});
