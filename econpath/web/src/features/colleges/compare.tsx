"use client";

import { Check, Download, Link2, Printer, X } from "lucide-react";
import { scaleLinear } from "d3-scale";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AgeLineChart } from "@/components/charts/age-line-chart";
import { ChartLegend, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { SourceBadge } from "@/components/data/source-badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { AXIS_TICK, SERIES } from "@/lib/chart";
import { simulatePath, type PathResult, type Residency } from "@/lib/engine";
import { pct, usd, usdCompact } from "@/lib/format";
import { navigate } from "@/lib/navigate";
import { cn } from "@/lib/utils";
import { buildPathInput, getCollege, getMajor } from "@/services/catalog";
import { collegeOptions, majorOptions } from "@/services/options";
import type { College } from "@/types/data";
import { MAX_COMPARE } from "./explorer";
import { allCollegeMetrics, collegeMetrics, percentile, type CollegeMetrics } from "./metrics";

type ChartKey = "gain" | "salary" | "debt";

interface Row {
  label: string;
  source: string;
  get: (m: CollegeMetrics) => number | null;
  format: (v: number) => string;
  better?: "higher" | "lower";
  note?: string;
}

const ROWS: { group: string; rows: Row[] }[] = [
  {
    group: "Cost",
    rows: [
      { label: "Tuition & fees (in-state)", source: "ipeds", get: (m) => m.college.tuitionInState, format: usd, better: "lower" },
      { label: "Tuition & fees (out-of-state)", source: "ipeds", get: (m) => m.college.tuitionOutOfState, format: usd, better: "lower" },
      { label: "Cost of attendance", source: "ipeds", get: (m) => m.college.costOfAttendance, format: usd, better: "lower" },
      { label: "Average net price / yr", source: "college-scorecard", get: (m) => m.netPrice, format: usd, better: "lower", note: "After grants; adjusted for residency" },
      { label: "Students receiving grants", source: "ipeds", get: (m) => m.college.pctReceivingGrants, format: (v) => pct(v), better: "higher" },
      { label: "Average grant aid", source: "ipeds", get: (m) => m.college.avgGrantAid, format: usd, better: "higher" },
      { label: "Four-year net cost", source: "college-scorecard", get: (m) => m.totalCost, format: usd, better: "lower", note: "With 3% annual price growth" },
    ],
  },
  {
    group: "Debt",
    rows: [
      { label: "Debt at graduation", source: "college-scorecard", get: (m) => m.debt, format: usd, better: "lower", note: "Typical borrowing share plus in-school interest" },
      { label: "Monthly loan payment", source: "college-scorecard", get: (m) => m.monthlyPayment, format: usd, better: "lower", note: "Ten-year standard plan at 6.39%" },
    ],
  },
  {
    group: "Outcomes",
    rows: [
      { label: "Acceptance rate", source: "college-scorecard", get: (m) => m.college.acceptanceRate, format: (v) => pct(v) },
      { label: "Graduation rate (6-yr)", source: "college-scorecard", get: (m) => m.college.gradRate, format: (v) => pct(v), better: "higher" },
      { label: "Median earnings, 10 yrs after entry", source: "college-scorecard", get: (m) => m.college.medianEarnings10yr, format: usd, better: "higher" },
      { label: "Earnings, first 5 years", source: "college-scorecard", get: (m) => m.earnings5, format: usdCompact, better: "higher", note: "Cumulative, future dollars" },
      { label: "Earnings, first 10 years", source: "college-scorecard", get: (m) => m.earnings10, format: usdCompact, better: "higher" },
      { label: "Earnings, first 20 years", source: "college-scorecard", get: (m) => m.earnings20, format: usdCompact, better: "higher", note: "Through age 40 when fewer than 20 working years remain" },
    ],
  },
  {
    group: "Return",
    rows: [
      { label: "Breakeven age", source: "college-scorecard", get: (m) => m.breakevenAge, format: (v) => `Age ${v}`, better: "lower" },
      { label: "Net present value to 40", source: "college-scorecard", get: (m) => m.npv, format: usdCompact, better: "higher", note: "vs. working from 18, 3% real discount rate" },
      { label: "ROI to age 40", source: "college-scorecard", get: (m) => m.roi, format: (v) => pct(v), better: "higher" },
    ],
  },
  {
    group: "Place",
    rows: [
      { label: "Regional price level (U.S. = 100)", source: "bea-rpp", get: (m) => m.rpp, format: (v) => v.toFixed(1), better: "lower" },
      { label: "Starting salary, purchasing-power adjusted", source: "bea-rpp", get: (m) => m.adjustedSalary, format: usdCompact, better: "higher", note: "Today's dollars at U.S.-average prices" },
    ],
  },
];

const RADAR_AXES: { key: string; label: string; get: (m: CollegeMetrics) => number; higherIsBetter: boolean }[] = [
  { key: "afford", label: "Affordability", get: (m) => m.netPrice, higherIsBetter: false },
  { key: "earn", label: "Earnings", get: (m) => m.college.medianEarnings10yr, higherIsBetter: true },
  { key: "grad", label: "Graduation", get: (m) => m.college.gradRate, higherIsBetter: true },
  { key: "debt", label: "Low debt", get: (m) => m.debt, higherIsBetter: false },
  { key: "roi", label: "ROI", get: (m) => m.roi, higherIsBetter: true },
  { key: "pp", label: "Buying power", get: (m) => m.adjustedSalary, higherIsBetter: true },
];

export function CollegeCompare() {
  const params = useSearchParams();
  const router = useRouter();
  const ids = (params.get("ids") ?? "")
    .split(",")
    .filter((id) => getCollege(id))
    .slice(0, MAX_COMPARE);
  const majorParam = params.get("major");
  const majorId = majorParam && getMajor(majorParam) ? majorParam : null;
  const residency: Residency = params.get("res") === "out" ? "out-of-state" : "in-state";
  const [chart, setChart] = useState<ChartKey>("gain");
  const [copied, setCopied] = useState(false);

  const update = (next: { ids?: string[]; major?: string | null; res?: Residency }) => {
    const q = new URLSearchParams();
    const nIds = next.ids ?? ids;
    const nMajor = next.major !== undefined ? next.major : majorId;
    const nRes = next.res ?? residency;
    if (nIds.length) q.set("ids", nIds.join(","));
    if (nMajor) q.set("major", nMajor);
    if (nRes === "out-of-state") q.set("res", "out");
    navigate(router, `/colleges/compare?${q.toString()}`, { replace: true });
  };

  // Cheap to recompute (a few dozen deterministic simulations), so no manual memoization.
  const pool = allCollegeMetrics({ majorId, residency });
  const items = ids.map((id, i) => {
    const college = getCollege(id)!;
    const metrics = collegeMetrics(college, { majorId, residency });
    const result = simulatePath(buildPathInput({ collegeId: id, majorId, residency }));
    return { college, metrics, result, color: SERIES[i] };
  });

  const radarData = RADAR_AXES.map((axis) => {
    const values = pool.map(axis.get);
    const row: Record<string, number | string> = { axis: axis.label };
    for (const it of items) row[it.college.id] = percentile(axis.get(it.metrics), values, axis.higherIsBetter);
    return row;
  });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt("Copy this link", window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = items.length ? `Economic Comparison: ${items.map((i) => i.college.shortName).join(" vs ")}` : "Compare colleges";
  const majorName = majorId ? getMajor(majorId)?.name : null;

  return (
    <div className="container-page py-8 sm:py-10">
      {/* Print-only report header */}
      <div className="mb-6 hidden border-b border-border pb-4 print:block">
        <p className="text-sm font-semibold">EconPath · Student report</p>
        <p className="text-xs text-muted-foreground">
          Generated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })} · {majorName ? `${majorName} majors` : "All majors (college medians)"} ·{" "}
          {residency === "in-state" ? "In-state" : "Out-of-state"} tuition
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link href="/colleges" className="no-print text-[12.5px] font-semibold tracking-wide text-primary hover:underline">
            ← College ROI Explorer
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Same assumptions for every college: {majorName ? `${majorName} graduates` : "the college's median graduate"}, working in the college&apos;s metro area,{" "}
            {residency === "in-state" ? "paying in-state tuition at public colleges" : "paying out-of-state tuition at public colleges"}.
          </p>
        </div>
        <div className="no-print flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={share}>
            {copied ? <Check /> : <Link2 />} {copied ? "Link copied" : "Share link"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Print report
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Download /> Export PDF
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="no-print mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:grid-cols-[1fr_220px_auto] md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {items.map((it) => (
            <span key={it.college.id} className="flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pr-1 pl-3 text-sm">
              <span className="size-2 rounded-full" style={{ background: it.color }} />
              {it.college.shortName}
              <button
                type="button"
                onClick={() => update({ ids: ids.filter((x) => x !== it.college.id) })}
                aria-label={`Remove ${it.college.shortName}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {ids.length < MAX_COMPARE && (
            <Combobox
              aria-label="Add a college"
              className="w-52"
              options={collegeOptions.filter((o) => !ids.includes(o.value))}
              value={null}
              onChange={(v) => v && update({ ids: [...ids, v] })}
              placeholder={`Add a college (${ids.length}/${MAX_COMPARE})`}
              searchPlaceholder="Search colleges"
            />
          )}
        </div>
        <Combobox aria-label="Major lens" options={majorOptions} value={majorId} onChange={(v) => update({ major: v })} placeholder="All majors" allowClear searchPlaceholder="Search majors" />
        <Segmented<Residency>
          aria-label="Residency"
          layoutId="compare-res"
          size="sm"
          value={residency}
          onChange={(v) => update({ res: v })}
          options={[
            { value: "in-state", label: "In-state" },
            { value: "out-of-state", label: "Out-of-state" },
          ]}
        />
      </div>

      {items.length < 2 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-medium">Add at least two colleges to compare.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try UCLA, UC Berkeley and USC.</p>
          <Button className="mt-4" onClick={() => update({ ids: ["ucla", "uc-berkeley", "usc"] })}>
            Load an example
          </Button>
        </div>
      ) : (
        <>
          {/* Side-by-side cards */}
          <section aria-label="Summary" className={cn("mt-6 grid gap-3", items.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-5")}>
            {items.map(({ college, metrics, color }) => (
              <CollegeCard key={college.id} college={college} metrics={metrics} color={color} best={bestIds(items.map((i) => i.metrics))} />
            ))}
          </section>

          {/* Trajectories */}
          <section className="mt-6 grid gap-6 break-inside-avoid lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">
                    {chart === "gain" ? "Cumulative net gain vs. working from 18" : chart === "salary" ? "Earnings trajectory" : "Debt payoff"}
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {chart === "gain"
                      ? "Earnings minus net price and interest, relative to a high school graduate. Crossing zero is breakeven."
                      : chart === "salary"
                        ? "Annual salary after graduation, future dollars."
                        : "Loan balance by age on a ten-year plan."}
                  </p>
                </div>
                <Segmented
                  aria-label="Trajectory chart"
                  layoutId="compare-chart"
                  size="sm"
                  className="no-print shrink-0"
                  value={chart}
                  onChange={setChart}
                  options={[
                    { value: "gain", label: "Net gain" },
                    { value: "salary", label: "Earnings" },
                    { value: "debt", label: "Debt" },
                  ]}
                />
              </div>
              <div className="mt-5">
                <AgeLineChart
                  ariaLabel="College comparison over time"
                  height={320}
                  zeroLine={chart !== "salary"}
                  series={items.map(({ college, result, color }) => ({
                    key: college.id,
                    label: college.shortName,
                    color,
                    points: result.rows.map((r) => ({
                      age: r.age,
                      value: chart === "gain" ? r.cumulativeNetGain : chart === "salary" ? (r.phase === "work" ? r.gross : null) : r.debtBalance,
                    })),
                  }))}
                />
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
              <h2 className="text-[15px] font-semibold tracking-tight">Profile vs. all {pool.length} colleges</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Percentile on each measure; 100 is the most favorable in the dataset.</p>
              <ChartLegend className="mt-4" items={items.map((i) => ({ label: i.college.shortName, color: i.color }))} />
              <div className="h-[300px]" role="img" aria-label="Radar chart of percentile ranks">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="66%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "var(--chart-label)" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {items.map((it) => (
                      <Radar key={it.college.id} dataKey={it.college.id} name={it.college.shortName} stroke={it.color} fill={it.color} fillOpacity={0.08} strokeWidth={2} />
                    ))}
                    <Tooltip
                      content={({ active, label, payload }) =>
                        active && payload?.length ? (
                          <ChartTooltipCard
                            title={String(label)}
                            rows={items.map((it) => ({
                              label: it.college.shortName,
                              color: it.color,
                              value: `${payload.find((p) => p.dataKey === it.college.id)?.value ?? "—"}th pct.`,
                            }))}
                          />
                        ) : null
                      }
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-6 break-inside-avoid rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight">Net lifetime value to age 40</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Present value of extra earnings minus net price and interest, compared with working from 18. Today&apos;s dollars.</p>
            <NpvBars items={items.map(({ college, result, color }) => ({ name: college.shortName, result, color }))} />
          </section>

          {/* Full metrics */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
              <h2 className="text-[15px] font-semibold tracking-tight">All metrics</h2>
              <p className="text-xs text-muted-foreground">
                <Check className="mr-1 inline size-3.5 text-positive" />
                marks the most favorable value
              </p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/60 text-left text-xs text-muted-foreground">
                    <th scope="col" className="sticky left-0 z-10 w-44 bg-muted py-3 pr-3 pl-5 font-medium sm:w-auto sm:pl-6">
                      Metric
                    </th>
                    {items.map((it) => (
                      <th key={it.college.id} scope="col" className="py-3 pr-5 text-right font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ background: it.color }} />
                          {it.college.shortName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                {ROWS.map((g) => (
                  <tbody key={g.group} className="divide-y divide-border border-b border-border">
                    <tr>
                      <th colSpan={items.length + 1} scope="colgroup" className="bg-background-elevated px-5 pt-4 pb-2 text-left text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase sm:px-6">
                        {g.group}
                      </th>
                    </tr>
                    {g.rows.map((row) => {
                      const vals = items.map((it) => row.get(it.metrics));
                      const nums = vals.filter((v): v is number => v != null);
                      const best = row.better && nums.length > 1 ? (row.better === "higher" ? Math.max(...nums) : Math.min(...nums)) : null;
                      return (
                        <tr key={row.label} className="hover:bg-muted/30">
                          <th scope="row" className="sticky left-0 z-10 w-44 bg-card py-2.5 pr-3 pl-5 text-left font-normal shadow-[1px_0_0_var(--border)] sm:w-auto sm:pl-6 sm:shadow-none">
                            <span className="flex items-center gap-1">
                              <span className="text-foreground">{row.label}</span>
                              <SourceBadge sourceId={row.source} label="" className="no-print" />
                            </span>
                            {row.note && <span className="block text-[11px] text-subtle-foreground">{row.note}</span>}
                          </th>
                          {vals.map((v, i) => (
                            <td key={items[i].college.id} className={cn("py-2.5 pr-5 text-right tabular", v === best ? "font-semibold" : "text-muted-foreground")}>
                              {v == null ? "—" : row.format(v)}
                              {v === best && <Check className="ml-1 inline size-3.5 text-positive" aria-label="most favorable" />}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-4 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">How to read this</h2>
              <p className="mt-2">
                Earnings come from federal data on students who received federal aid and describe typical outcomes, not guarantees. Differences between colleges partly reflect who
                enrolls, not only what the college adds, so EconPath dampens the raw earnings gap when a major is selected.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">Assumptions</h2>
              <p className="mt-2">
                2.5% inflation, 3% tuition growth, 6.39% loan rate on a ten-year plan, 3% real discount rate, and a high school graduate in the same metro as the comparison.{" "}
                <Link href="/methodology" className="font-medium text-primary hover:underline">
                  Full methodology
                </Link>
                . To change them, model any college in{" "}
                <Link href="/dashboard" className="font-medium text-primary hover:underline">
                  your dashboard
                </Link>
                .
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function bestIds(ms: CollegeMetrics[]) {
  const by = (get: (m: CollegeMetrics) => number, higher: boolean) => {
    const sorted = [...ms].sort((a, b) => (higher ? get(b) - get(a) : get(a) - get(b)));
    return sorted[0]?.college.id;
  };
  return {
    netPrice: by((m) => m.netPrice, false),
    earnings: by((m) => m.college.medianEarnings10yr, true),
    debt: by((m) => m.debt, false),
    roi: by((m) => m.roi, true),
  };
}

function CollegeCard({ college, metrics, color, best }: { college: College; metrics: CollegeMetrics; color: string; best: ReturnType<typeof bestIds> }) {
  const stats: { label: string; value: string; best: boolean }[] = [
    { label: "Net price / yr", value: usdCompact(metrics.netPrice), best: best.netPrice === college.id },
    { label: "Earnings, yr 10", value: usdCompact(college.medianEarnings10yr), best: best.earnings === college.id },
    { label: "Debt", value: usdCompact(metrics.debt), best: best.debt === college.id },
    { label: "ROI to 40", value: pct(metrics.roi), best: best.roi === college.id },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <Link href={`/colleges/${college.id}`} className="font-semibold hover:text-primary">
        {college.shortName}
      </Link>
      <p className="text-xs text-muted-foreground">
        {metrics.metroName} · {college.control === "public" ? "Public" : "Private"}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
            <dd className="flex items-center gap-1 text-[15px] font-semibold tabular">
              {s.value}
              {s.best && <Check className="size-3.5 text-positive" aria-label="best in comparison" />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
        Breakeven <span className="font-medium text-foreground">{metrics.breakevenAge ? `age ${metrics.breakevenAge}` : "after 40"}</span>
      </p>
    </div>
  );
}

function NpvBars({ items }: { items: { name: string; result: PathResult; color: string }[] }) {
  const data = items.map((i) => ({ name: i.name, value: i.result.summary.netPresentValue, color: i.color }));
  const x = scaleLinear()
    .domain([Math.min(0, ...data.map((d) => d.value)), Math.max(0, ...data.map((d) => d.value))])
    .nice(4);
  const xTicks = x.ticks(4);
  const xDomain = x.domain() as [number, number];
  return (
    <div className="mt-4" style={{ height: 56 * data.length + 24 }} role="img" aria-label={data.map((d) => `${d.name}: ${usdCompact(d.value)}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 8 }} barCategoryGap={14}>
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} domain={xDomain} ticks={xTicks} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fill: "var(--foreground)", fontSize: 12 }} tickLine={false} axisLine={false} width={96} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as (typeof data)[number] | undefined;
              return active && d ? <ChartTooltipCard title={d.name} rows={[{ label: "Net present value", value: usd(d.value), color: d.color, emphasis: true }]} /> : null;
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", formatter: (v: unknown) => usdCompact(Number(v)), fontSize: 12, fill: "var(--foreground)" }} animationDuration={600}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
