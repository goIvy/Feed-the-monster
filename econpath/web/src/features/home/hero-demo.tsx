"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, XAxis } from "recharts";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip } from "@/components/ui/tooltip";
import { usd, usdCompact } from "@/lib/format";
import { HERO_PATHS, runDemo } from "./demo-paths";

const METRICS = [
  {
    key: "earnings10",
    label: "10-year earnings",
    help: "Total pre-tax pay over the first ten years of work after graduation, in future dollars.",
    format: usdCompact,
  },
  { key: "cost", label: "Four-year net cost", help: "Average net price after grants, times four years, with 3% annual price growth.", format: usdCompact },
  { key: "debt", label: "Debt at graduation", help: "Typical borrowing share for this college, plus interest that accrues while enrolled.", format: usdCompact },
  { key: "living", label: "Monthly living cost", help: "Median one-bedroom rent plus groceries, utilities, healthcare, transportation and personal spending in the college's metro.", format: usd },
  { key: "pp", label: "Purchasing power", help: "First-year take-home pay restated at national-average prices, in today's dollars.", format: usdCompact },
  { key: "breakeven", label: "Breakeven age", help: "The age when cumulative earnings, net of college costs and interest, pass what you would have earned starting work at 18.", format: (v: number) => Math.round(v).toString() },
] as const;

export function HeroDemo() {
  const [key, setKey] = useState(HERO_PATHS[0].key);
  const results = useMemo(() => Object.fromEntries(HERO_PATHS.map((p) => [p.key, runDemo(p)])), []);
  const r = results[key];
  const s = r.summary;
  const budget = s.firstYearBudget;
  const values: Record<(typeof METRICS)[number]["key"], number> = {
    earnings10: s.earnings10,
    cost: s.totalCollegeCost,
    debt: s.debtAtGraduation,
    living: budget.rent + budget.living,
    pp: s.purchasingPower,
    breakeven: s.breakevenAge ?? 0,
  };
  const series = r.rows.map((row) => ({ age: row.age, gain: row.cumulativeNetGain }));

  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-primary/10 via-violet/10 to-emerald/10 blur-2xl" />
      <div className="glass rounded-3xl border border-border p-4 shadow-lift sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Live preview</p>
            <p className="text-sm font-semibold">{HERO_PATHS.find((p) => p.key === key)!.label}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-[11px] font-medium text-emerald">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald" />
            Modeled
          </span>
        </div>

        <div className="-mx-1 mt-3 overflow-x-auto px-1 scrollbar-none">
          <Segmented
            aria-label="Choose an example path"
            layoutId="hero-demo"
            size="sm"
            value={key}
            onChange={setKey}
            options={HERO_PATHS.map((p) => ({ value: p.key, label: p.label.replace(" at ", " · ") }))}
          />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
              <dt className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                {m.label}
                <Tooltip content={m.help}>
                  <button type="button" aria-label={`About ${m.label}`} className="rounded-full text-subtle-foreground hover:text-foreground">
                    <Info className="size-3" />
                  </button>
                </Tooltip>
              </dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight tabular">
                <AnimatedNumber value={values[m.key]} format={m.format} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <div className="flex items-baseline justify-between">
            <p className="text-[11.5px] text-muted-foreground">Net gain vs. starting work at 18</p>
            <p className="text-xs font-medium tabular">
              <AnimatedNumber value={s.netPresentValue} format={usdCompact} /> <span className="font-normal text-subtle-foreground">NPV to 40</span>
            </p>
          </div>
          <div className="h-20" role="img" aria-label={`Cumulative net gain crosses zero at age ${s.breakevenAge ?? "after 40"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="hero-gain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="age" hide />
                <ReferenceLine y={0} stroke="var(--chart-axis)" />
                <Area type="monotone" dataKey="gain" stroke="var(--chart-1)" strokeWidth={2} fill="url(#hero-gain)" isAnimationActive animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10.5px] text-subtle-foreground tabular">
            <span>Age 18</span>
            <span>Age 40</span>
          </div>
        </div>

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-subtle-foreground">
          Estimates from EconPath&apos;s seed dataset with default assumptions. Not a guarantee.{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            How this is calculated
          </Link>
        </p>
      </div>
    </div>
  );
}
