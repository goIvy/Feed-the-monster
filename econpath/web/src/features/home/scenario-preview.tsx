"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AgeLineChart } from "@/components/charts/age-line-chart";
import { Slider } from "@/components/ui/slider";
import { MUTED_SERIES } from "@/lib/chart";
import { simulatePath } from "@/lib/engine";
import { signedPct, usd, usdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildPathInput } from "@/services/catalog";

const input = buildPathInput({ collegeId: "ucla", majorId: "economics" });
const INITIAL = { salary: 0, rent: 0, scholarship: 0, inflation: 2.5 };

export function ScenarioPreview() {
  const [v, setV] = useState(INITIAL);
  const base = useMemo(() => simulatePath(input), []);
  const scenario = useMemo(
    () =>
      simulatePath(input, {
        salaryChange: v.salary / 100,
        rentChange: v.rent / 100,
        scholarshipPerYear: v.scholarship,
        inflation: v.inflation / 100,
      }),
    [v],
  );

  const controls = [
    { key: "salary" as const, label: "Starting salary", min: -30, max: 30, step: 1, fmt: (n: number) => signedPct(n, 0) },
    { key: "rent" as const, label: "Rent", min: -20, max: 40, step: 1, fmt: (n: number) => signedPct(n, 0) },
    { key: "scholarship" as const, label: "Scholarship per year", min: 0, max: 20000, step: 500, fmt: (n: number) => usd(n) },
    { key: "inflation" as const, label: "Inflation", min: 1, max: 6, step: 0.1, fmt: (n: number) => `${n.toFixed(1)}%` },
  ];

  const deltas = [
    { label: "Debt at graduation", a: base.summary.debtAtGraduation, b: scenario.summary.debtAtGraduation, lowerIsBetter: true, fmt: usdCompact },
    { label: "Monthly disposable", a: base.summary.monthlyDisposable, b: scenario.summary.monthlyDisposable, lowerIsBetter: false, fmt: usd },
    { label: "Net worth at 40", a: base.summary.netWorthAtHorizon, b: scenario.summary.netWorthAtHorizon, lowerIsBetter: false, fmt: usdCompact },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Economics at UCLA</h3>
            <p className="text-xs text-muted-foreground">Then working in Los Angeles</p>
          </div>
          <button
            type="button"
            onClick={() => setV(INITIAL)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>
        <div className="mt-5 space-y-5">
          {controls.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-[13px]">
                <label id={`sp-${c.key}`} className="text-muted-foreground">
                  {c.label}
                </label>
                <span className="font-medium tabular">{c.fmt(v[c.key])}</span>
              </div>
              <Slider
                aria-labelledby={`sp-${c.key}`}
                aria-label={c.label}
                min={c.min}
                max={c.max}
                step={c.step}
                value={[v[c.key]]}
                onValueChange={([n]) => setV((prev) => ({ ...prev, [c.key]: n }))}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <dl className="grid grid-cols-3 gap-3">
          {deltas.map((d) => {
            const diff = d.b - d.a;
            const good = d.lowerIsBetter ? diff < 0 : diff > 0;
            return (
              <div key={d.label}>
                <dt className="text-[11.5px] text-muted-foreground">{d.label}</dt>
                <dd className="mt-1 text-lg font-semibold tracking-tight tabular sm:text-xl">{d.fmt(d.b)}</dd>
                <dd className={cn("text-xs tabular", Math.abs(diff) < 1 ? "text-subtle-foreground" : good ? "text-positive" : "text-negative")}>
                  {Math.abs(diff) < 1 ? "No change" : `${diff > 0 ? "+" : "−"}${d.fmt(Math.abs(diff))}`}
                </dd>
              </div>
            );
          })}
        </dl>
        <div className="mt-5">
          <AgeLineChart
            ariaLabel="Cumulative net gain, baseline versus your scenario"
            zeroLine
            height={240}
            series={[
              { key: "base", label: "Baseline", color: MUTED_SERIES, dashed: true, points: base.rows.map((r) => ({ age: r.age, value: r.cumulativeNetGain })) },
              { key: "scenario", label: "Your scenario", color: "var(--chart-1)", points: scenario.rows.map((r) => ({ age: r.age, value: r.cumulativeNetGain })) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
