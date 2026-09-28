"use client";

import { ChartLegend } from "@/components/charts/chart-tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { SERIES } from "@/lib/chart";
import type { MonthlyBudget } from "@/lib/engine";
import { usd } from "@/lib/format";

const SEGMENTS = [
  { key: "taxes", label: "Taxes", color: SERIES[0] },
  { key: "rent", label: "Rent", color: SERIES[1] },
  { key: "living", label: "Everyday costs", color: SERIES[2] },
  { key: "loanPayment", label: "Student loan", color: SERIES[3] },
  { key: "left", label: "Savings & discretionary", color: SERIES[4] },
] as const;

/** Where one month of gross pay goes, one stacked bar per path. 2px surface gaps separate segments. */
export function BudgetBars({ rows }: { rows: { key: string; label: string; budget: MonthlyBudget }[] }) {
  return (
    <div>
      <ChartLegend className="mb-5" items={SEGMENTS.map((s) => ({ label: s.label, color: s.color }))} />
      <ul className="space-y-6">
        {rows.map(({ key, label, budget }) => {
          const left = budget.retirement + budget.disposable;
          const parts = {
            taxes: budget.taxes,
            rent: budget.rent,
            living: budget.living,
            loanPayment: budget.loanPayment,
            left: Math.max(0, left),
          };
          const total = Object.values(parts).reduce((a, b) => a + b, 0);
          return (
            <li key={key}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground tabular">{usd(budget.gross)} gross per month</span>
              </div>
              <div className="flex h-9 gap-[2px] overflow-hidden rounded-lg" role="img" aria-label={`${label}: ${SEGMENTS.map((s) => `${s.label} ${usd(parts[s.key])}`).join(", ")}`}>
                {SEGMENTS.map((s) =>
                  parts[s.key] > 0 ? (
                    <Tooltip key={s.key} content={`${s.label}: ${usd(parts[s.key])} a month (${Math.round((parts[s.key] / budget.gross) * 100)}% of gross)`}>
                      <div
                        className="flex h-full min-w-0 items-center justify-center text-[11px] font-medium text-white transition-[width] duration-500 first:rounded-l-lg last:rounded-r-lg"
                        style={{ width: `${((parts[s.key] / total) * 100).toFixed(2)}%`, background: s.color }}
                      >
                        {parts[s.key] / total > 0.11 && <span className="truncate px-1 tabular drop-shadow-sm">{usd(parts[s.key])}</span>}
                      </div>
                    </Tooltip>
                  ) : null,
                )}
              </div>
              {left < 0 && (
                <p className="mt-2 text-xs text-negative">
                  Costs exceed take-home pay by {usd(-left)} a month in the first year. A roommate, lower rent, or a different city would close the gap.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
