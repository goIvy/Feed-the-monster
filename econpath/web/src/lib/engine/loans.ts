/** Level monthly payment that retires `principal` over `years` at `annualRate` (APR, monthly compounding). */
export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const n = Math.round(years * 12);
  if (n <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export interface AmortizationYear {
  year: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface Amortization {
  monthlyPayment: number;
  months: number;
  totalInterest: number;
  totalPaid: number;
  years: AmortizationYear[];
}

/** Month-by-month amortization rolled up to years. `extraMonthly` models paying ahead. */
export function amortize(principal: number, annualRate: number, years: number, extraMonthly = 0): Amortization {
  const payment = monthlyPayment(principal, annualRate, years) + Math.max(0, extraMonthly);
  const r = annualRate / 12;
  let balance = principal;
  let months = 0;
  let totalInterest = 0;
  const out: AmortizationYear[] = [];
  let yInterest = 0;
  let yPrincipal = 0;
  while (balance > 0.005 && months < 1200) {
    const interest = balance * r;
    const pay = Math.min(payment, balance + interest);
    balance = balance + interest - pay;
    yInterest += interest;
    yPrincipal += pay - interest;
    totalInterest += interest;
    months += 1;
    if (months % 12 === 0 || balance <= 0.005) {
      out.push({ year: out.length + 1, interest: yInterest, principal: yPrincipal, balance: Math.max(0, balance) });
      yInterest = 0;
      yPrincipal = 0;
    }
  }
  return { monthlyPayment: payment, months, totalInterest, totalPaid: principal + totalInterest, years: out };
}
