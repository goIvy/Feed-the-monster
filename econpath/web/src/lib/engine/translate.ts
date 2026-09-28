import type { City } from "@/types/data";
import { monthlyLiving } from "./profile";
import { computeTaxes } from "./tax";

export interface CityTaxContext {
  city: City;
  stateTaxRate: number;
}

/** Take-home pay divided by the city's price level: what the paycheck buys at national-average prices. */
export function realTakeHome(salary: number, { city, stateTaxRate }: CityTaxContext): number {
  const { takeHome } = computeTaxes({ gross: salary, stateRate: stateTaxRate, localRate: city.localIncomeTaxRate });
  return takeHome / (city.rpp / 100);
}

/**
 * Salary in `to` that buys the same lifestyle as `salary` in `from`, after
 * taxes and local prices. Solved by bisection because taxes are progressive.
 */
export function equivalentSalary(salary: number, from: CityTaxContext, to: CityTaxContext): number {
  const target = realTakeHome(salary, from);
  let lo = 0;
  let hi = Math.max(salary * 4, 50_000);
  for (let i = 0; i < 60; i++) {
    const midpoint = (lo + hi) / 2;
    if (realTakeHome(midpoint, to) < target) lo = midpoint;
    else hi = midpoint;
  }
  return (lo + hi) / 2;
}

export interface CityBudget {
  takeHomeMonthly: number;
  rent: number;
  living: number;
  leftover: number;
  savingsPotential: number;
  purchasingPower: number;
}

export function cityBudget(salary: number, ctx: CityTaxContext): CityBudget {
  const { takeHome } = computeTaxes({ gross: salary, stateRate: ctx.stateTaxRate, localRate: ctx.city.localIncomeTaxRate });
  const monthly = takeHome / 12;
  const living = monthlyLiving(ctx.city).total;
  const leftover = monthly - ctx.city.medianRent1br - living;
  return {
    takeHomeMonthly: monthly,
    rent: ctx.city.medianRent1br,
    living,
    leftover,
    savingsPotential: Math.max(0, leftover) / monthly,
    purchasingPower: takeHome / (ctx.city.rpp / 100),
  };
}
