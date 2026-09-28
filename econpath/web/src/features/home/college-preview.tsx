"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AgeLineChart } from "@/components/charts/age-line-chart";
import { Button } from "@/components/ui/button";
import { SERIES } from "@/lib/chart";
import { simulatePath } from "@/lib/engine";
import { pct, usdCompact } from "@/lib/format";
import { buildPathInput, getCollege } from "@/services/catalog";

const IDS = ["ucla", "uc-berkeley", "usc"];

export function CollegePreview() {
  const rows = useMemo(
    () =>
      IDS.map((id, i) => {
        const college = getCollege(id)!;
        const result = simulatePath(buildPathInput({ collegeId: id }));
        return { college, result, color: SERIES[i] };
      }),
    [],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold tracking-tight">Cumulative net gain vs. starting work at 18</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Earnings minus net price and interest, relative to a high school graduate in the same metro. The line crosses zero at breakeven.
          </p>
        </div>
        <AgeLineChart
          ariaLabel="Cumulative net gain for UCLA, UC Berkeley and USC by age"
          zeroLine
          height={280}
          series={rows.map((r) => ({
            key: r.college.id,
            label: r.college.shortName,
            color: r.color,
            points: r.result.rows.map((row) => ({ age: row.age, value: row.cumulativeNetGain })),
          }))}
        />
      </div>

      <div className="grid gap-3">
        {rows.map(({ college, result, color }) => (
          <div key={college.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-1 rounded-full" style={{ background: color }} />
                <div>
                  <p className="text-sm font-semibold">{college.shortName}</p>
                  <p className="text-xs text-muted-foreground">{college.control === "public" ? "Public" : "Private"} · Grad rate {pct(college.gradRate)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Breakeven</p>
                <p className="text-sm font-semibold tabular">Age {result.summary.breakevenAge ?? "40+"}</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Net price / yr</dt>
                <dd className="mt-0.5 text-sm font-medium tabular">{usdCompact(college.avgNetPrice)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Median debt</dt>
                <dd className="mt-0.5 text-sm font-medium tabular">{usdCompact(college.medianDebt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Earnings, yr 10</dt>
                <dd className="mt-0.5 text-sm font-medium tabular">{usdCompact(college.medianEarnings10yr)}</dd>
              </div>
            </dl>
          </div>
        ))}
        <Button asChild variant="outline" className="justify-between">
          <Link href={`/colleges/compare?ids=${IDS.join(",")}`}>
            Open the full comparison <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
