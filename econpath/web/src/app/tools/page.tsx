import { Calculator, Coins, Home, LineChart, PiggyBank, Receipt, Scale, School, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { LoanCalculator } from "@/features/tools/loan-calculator";

export const metadata: Metadata = {
  title: "Financial tools",
  description: "Student loan, tax, rent, savings and opportunity cost calculators built on EconPath's engine.",
};

const UPCOMING = [
  { icon: Receipt, name: "Salary after tax", body: "Federal, state and local tax for any salary and city." },
  { icon: Home, name: "Rent affordability", body: "How much rent a salary supports under common rules of thumb." },
  { icon: School, name: "College cost", body: "Four-year cost with aid, price growth and borrowing." },
  { icon: PiggyBank, name: "Savings projection", body: "What steady saving grows to over time." },
  { icon: LineChart, name: "Compound interest", body: "The math behind long-run growth, visualized." },
  { icon: TrendingUp, name: "Retirement projection", body: "Contributions, employer match and returns to 65." },
  { icon: Scale, name: "Opportunity cost", body: "What you give up by choosing one path over another." },
  { icon: Coins, name: "Debt payoff", body: "Avalanche vs. snowball across several debts." },
];

export default function ToolsPage() {
  return (
    <>
      <PageHeader eyebrow="Tools" title="Calculators that show their work." description="Each tool runs on the same tested engine as the rest of EconPath, so the numbers match everywhere." />
      <div className="container-page space-y-10 py-10">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Student loan calculator</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Standard amortization, month by month. Add an extra monthly payment to see how much interest you save.</p>
          <div className="mt-6">
            <LoanCalculator />
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Coming next</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING.map(({ icon: Icon, name, body }) => (
              <li key={name} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" />
                  <Badge variant="muted">Soon</Badge>
                </div>
                <p className="mt-4 font-medium">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
