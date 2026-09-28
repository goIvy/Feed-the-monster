"use client";

import {
  Check,
  Download,
  Lightbulb,
  Link2,
  Plus,
  Save,
  SlidersHorizontal,
  Sparkles,
  Table2,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AgeLineChart, type AgeSeries } from "@/components/charts/age-line-chart";
import { BudgetBars } from "@/components/charts/budget-bars";
import { ChartDataTable } from "@/components/charts/data-table";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip } from "@/components/ui/tooltip";
import { useStoredState } from "@/hooks/use-stored-state";
import { MUTED_SERIES, SERIES } from "@/lib/chart";
import { simulatePath, type PathResult } from "@/lib/engine";
import { signedPct, usd, usdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildPathInput, getMajor, getOccupation } from "@/services/catalog";
import { AssumptionsPanel, FACTORS, type Factor } from "./assumptions-panel";
import { PathEditor } from "./path-editor";
import {
  DASHBOARD_KEY,
  DEFAULT_DASHBOARD,
  EMPTY_PROFILE,
  MAX_PATHS,
  PROFILE_KEY,
  decodeState,
  encodeState,
  newPath,
  pathLabel,
  type DashboardState,
  type PathConfig,
} from "./state";

type ChartKey = "earnings" | "breakeven" | "debt" | "networth" | "budget";

const CHARTS: { key: ChartKey; label: string; title: string; description: string }[] = [
  { key: "earnings", label: "Earnings", title: "Salary by age", description: "Gross annual pay in future dollars. The dashed line is a high school graduate in the same city." },
  { key: "breakeven", label: "Breakeven", title: "Cumulative net gain vs. starting work at 18", description: "Earnings minus net price and loan interest, relative to working from age 18. Crossing zero is the breakeven point." },
  { key: "debt", label: "Debt", title: "Student loan balance", description: "Interest accrues while enrolled; repayment follows a standard ten-year plan." },
  { key: "networth", label: "Net worth", title: "Net worth by age", description: "Savings and retirement balances minus remaining student debt." },
  { key: "budget", label: "Monthly budget", title: "Where the first paycheck goes", description: "One month of gross pay in the first year after graduation." },
];

const STAGE_COPY: Record<string, string> = {
  "high-school": "Built from your answers. Adjust anything; nothing here is a prediction about you personally.",
  college: "Built from your answers. Try another major or city to see how the picture shifts.",
  "recent-grad": "Built from your answers. Use the sliders to test offers, rent and loan choices.",
  parent: "Built from your answers. Compare net price, borrowing and payback on the same basis.",
  counselor: "Built from your answers. Share or print any view for a student meeting.",
};

function run(path: PathConfig, state: DashboardState): PathResult {
  return simulatePath(
    buildPathInput({ collegeId: path.collegeId, majorId: path.majorId, occupationId: path.occupationId, cityId: path.cityId, residency: path.residency }),
    state.assumptions,
  );
}

export function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [stored, setStored] = useStoredState<DashboardState>(DASHBOARD_KEY, DEFAULT_DASHBOARD);
  const [profile] = useStoredState(PROFILE_KEY, EMPTY_PROFILE);
  const shared = useMemo(() => {
    const s = params.get("s");
    return s ? decodeState(s) : null;
  }, [params]);
  const [sharedDraft, setSharedDraft] = useState<DashboardState | null>(null);
  const viewingShared = shared != null;
  const state = viewingShared ? (sharedDraft ?? shared) : stored;
  const setState = (next: DashboardState) => (viewingShared ? setSharedDraft(next) : setStored(next));

  const [chart, setChart] = useState<ChartKey>("earnings");
  const [showTable, setShowTable] = useState(false);
  const [touched, setTouched] = useState<Set<Factor>>(new Set());
  const [copied, setCopied] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const welcome = params.get("welcome") != null && !welcomeDismissed;

  const results = useMemo(() => state.paths.map((p) => ({ path: p, result: run(p, state) })), [state]);
  const primary = results[0].result;

  const updatePath = (i: number, p: PathConfig) => setState({ ...state, paths: state.paths.map((x, j) => (j === i ? p : x)) });
  const removePath = (i: number) => setState({ ...state, paths: state.paths.filter((_, j) => j !== i) });
  const addPath = () => state.paths.length < MAX_PATHS && setState({ ...state, paths: [...state.paths, newPath(state.paths[0])] });

  const share = async () => {
    const url = `${window.location.origin}/dashboard?s=${encodeState(state)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveShared = () => {
    setStored(state);
    router.replace("/dashboard");
  };

  const insight = useMemo(() => buildInsight(results), [results]);

  const series = (get: (r: PathResult["rows"][number]) => number | null, withBaseline = false): AgeSeries[] => {
    const lines: AgeSeries[] = results.map(({ path, result }, i) => ({
      key: path.id,
      label: `${String.fromCharCode(65 + i)}: ${pathLabel(path).title}`,
      color: SERIES[i],
      points: result.rows.map((r) => ({ age: r.age, value: get(r) })),
    }));
    if (withBaseline) {
      lines.push({
        key: "hs",
        label: "High school graduate",
        color: MUTED_SERIES,
        dashed: true,
        points: primary.rows.map((r) => ({ age: r.age, value: r.highSchoolGross })),
      });
    }
    return lines;
  };

  const chartMeta = CHARTS.find((c) => c.key === chart)!;
  const gradAge = primary.summary.graduationAge;

  return (
    <div className="container-page py-8 sm:py-10">
      <AnimatePresence>
        {viewingShared && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="no-print mb-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-accent px-4 py-3 text-sm text-accent-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <Link2 className="size-4" /> You&apos;re viewing a shared dashboard. Changes stay local until you save.
            </span>
            <Button size="sm" onClick={saveShared}>
              <Save /> Save as my dashboard
            </Button>
          </motion.div>
        )}
        {welcome && !viewingShared && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="no-print mb-6 flex items-start justify-between gap-3 rounded-2xl border border-emerald/25 bg-emerald-soft px-4 py-3 text-sm text-emerald"
          >
            <span className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              <span>
                Your dashboard is ready. {state.paths.length < MAX_PATHS ? "Next, try comparing another path side by side." : "All three of your paths are side by side."}
              </span>
            </span>
            <button type="button" onClick={() => setWelcomeDismissed(true)} aria-label="Dismiss" className="rounded-full p-0.5 hover:bg-emerald/10">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12.5px] font-semibold tracking-wide text-primary">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[40px]">Your Economic Future</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {(profile.stage && STAGE_COPY[profile.stage]) ?? "Every number updates as you change a path or an assumption. Estimates, not guarantees."}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/start">
              <UserRound /> {profile.completed ? "Edit answers" : "Personalize"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={share}>
            {copied ? <Check /> : <Link2 />} {copied ? "Link copied" : "Share"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download /> Export PDF
          </Button>
        </div>
      </div>

      {/* Paths */}
      <section aria-label="Paths" className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {state.paths.map((p, i) => (
          <PathEditor
            key={p.id}
            path={p}
            index={i}
            color={SERIES[i]}
            onChange={(next) => updatePath(i, next)}
            onRemove={state.paths.length > 1 ? () => removePath(i) : undefined}
          />
        ))}
        {state.paths.length < MAX_PATHS && (
          <button
            type="button"
            onClick={addPath}
            className="no-print group flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground transition hover:border-primary hover:bg-accent/50 hover:text-accent-foreground"
          >
            <span className="grid size-9 place-items-center rounded-full bg-muted transition group-hover:bg-primary group-hover:text-primary-foreground">
              <Plus className="size-4" />
            </span>
            Compare another path
            <span className="text-xs text-subtle-foreground">Up to {MAX_PATHS} side by side</span>
          </button>
        )}
      </section>

      {/* KPIs */}
      <section aria-label="Summary" className="mt-6">
        <KpiGrid results={results} />
      </section>

      {/* Insight + progress */}
      <div className="no-print mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        {insight && (
          <p className="flex items-start gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber" />
            <span>{insight}</span>
          </p>
        )}
        <ExploreProgress touched={touched} />
      </div>

      {/* Charts + assumptions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section aria-labelledby="chart-title" className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
              <Segmented aria-label="Chart" layoutId="dash-chart" size="sm" value={chart} onChange={setChart} options={CHARTS.map((c) => ({ value: c.key, label: c.label }))} />
            </div>
            {chart !== "budget" && (
              <button
                type="button"
                onClick={() => setShowTable((s) => !s)}
                aria-pressed={showTable}
                className="no-print flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground sm:self-auto"
              >
                <Table2 className="size-3.5" /> {showTable ? "Show chart" : "View as table"}
              </button>
            )}
          </div>
          <h2 id="chart-title" className="mt-5 text-[15px] font-semibold tracking-tight">
            {chartMeta.title}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{chartMeta.description}</p>
          <div className="mt-5">
            {chart === "budget" ? (
              <BudgetBars
                rows={results.map(({ path, result }, i) => ({
                  key: path.id,
                  label: `${String.fromCharCode(65 + i)}: ${pathLabel(path).title}`,
                  budget: result.summary.firstYearBudget,
                }))}
              />
            ) : showTable ? (
              <ChartDataTable
                caption={chartMeta.title}
                columns={[
                  { key: "age", label: "Age" },
                  ...results.map(({ path }, i) => ({ key: path.id, label: `Path ${String.fromCharCode(65 + i)}`, align: "right" as const })),
                ]}
                rows={primary.rows.map((row, idx) => ({
                  age: row.age,
                  ...Object.fromEntries(
                    results.map(({ path, result }) => {
                      const r = result.rows[idx];
                      const v = chart === "earnings" ? r.gross : chart === "breakeven" ? r.cumulativeNetGain : chart === "debt" ? r.debtBalance : r.netWorth;
                      return [path.id, usd(v)];
                    }),
                  ),
                }))}
              />
            ) : (
              <AgeLineChart
                height={340}
                ariaLabel={chartMeta.title}
                zeroLine={chart === "breakeven" || chart === "networth"}
                markers={[{ age: gradAge, label: "Graduate" }]}
                series={
                  chart === "earnings"
                    ? series((r) => (r.phase === "work" ? r.gross : null), true)
                    : chart === "breakeven"
                      ? series((r) => r.cumulativeNetGain)
                      : chart === "debt"
                        ? series((r) => r.debtBalance)
                        : series((r) => r.netWorth)
                }
              />
            )}
          </div>
        </section>

        <aside className="no-print">
          <div className="hidden rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20 lg:block">
            <AssumptionsPanel value={state.assumptions} onChange={(a) => setState({ ...state, assumptions: a })} onTouch={(f) => setTouched((t) => new Set(t).add(f))} />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="dark" className="fixed right-4 bottom-4 z-30 shadow-lift lg:hidden">
                <SlidersHorizontal /> Assumptions
              </Button>
            </DialogTrigger>
            <DialogContent className="top-auto bottom-3 max-h-[80dvh] translate-y-0 overflow-y-auto p-5">
              <DialogTitle className="sr-only">Assumptions</DialogTitle>
              <AssumptionsPanel value={state.assumptions} onChange={(a) => setState({ ...state, assumptions: a })} onTouch={(f) => setTouched((t) => new Set(t).add(f))} />
            </DialogContent>
          </Dialog>
        </aside>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-subtle-foreground">
        Projections use EconPath&apos;s seed dataset and the assumptions shown. They describe typical outcomes, not what will happen to any one person.{" "}
        <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
          Methodology
        </Link>
      </p>
    </div>
  );
}

function ExploreProgress({ touched }: { touched: Set<Factor> }) {
  const n = FACTORS.filter((f) => touched.has(f)).length;
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--secondary)" strokeWidth="4" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--emerald)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - n / FACTORS.length) }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <p className="text-sm" aria-live="polite">
        <span className="font-medium">
          You&apos;ve explored {n} of {FACTORS.length} financial factors
        </span>
        <span className="block text-xs text-muted-foreground">
          {n === FACTORS.length ? "Every lever tested. Nice work." : "Tuition, aid, salary, rent, inflation and loans"}
        </span>
      </p>
    </div>
  );
}

function buildInsight(results: { path: PathConfig; result: PathResult }[]): string | null {
  if (results.length > 1) {
    const bySalary = [...results].sort((a, b) => b.result.summary.startingSalary - a.result.summary.startingSalary);
    const byPower = [...results].sort((a, b) => b.result.summary.purchasingPower - a.result.summary.purchasingPower);
    if (bySalary[0].path.id !== byPower[0].path.id) {
      return `Adjusting for cost of living changes the leader: ${pathLabel(bySalary[0].path).title} pays the most, but ${pathLabel(byPower[0].path).title} buys the most after taxes and local prices.`;
    }
    const byNpv = [...results].sort((a, b) => b.result.summary.netPresentValue - a.result.summary.netPresentValue);
    const gap = byNpv[0].result.summary.netPresentValue - byNpv[byNpv.length - 1].result.summary.netPresentValue;
    return `${pathLabel(byNpv[0].path).title} leads on both salary and purchasing power, with a ${usdCompact(gap)} advantage in present value by age 40.`;
  }
  const s = results[0].result.summary;
  const b = s.firstYearBudget;
  const rentShare = b.rent / (b.gross - b.taxes - b.retirement);
  if (rentShare > 0.4) {
    return `Rent would take ${Math.round(rentShare * 100)}% of take-home pay in the first year. Try "Share an apartment" or a different city to see how much that changes.`;
  }
  return `Breakeven arrives at age ${s.breakevenAge ?? "40+"}. Try raising tuition or lowering the starting salary to see how sensitive that is.`;
}

interface Kpi {
  key: string;
  label: string;
  help: string;
  value: (r: PathResult, p: PathConfig) => number | null;
  format: (v: number) => string;
  sub?: (r: PathResult) => string;
  better: "higher" | "lower";
}

const KPIS: Kpi[] = [
  {
    key: "start",
    label: "Starting salary",
    help: "First full year of pay after graduation, in that year's dollars.",
    value: (r) => r.summary.startingSalary,
    format: usdCompact,
    sub: (r) => `${usdCompact(r.summary.startingSalaryToday)} in today's dollars`,
    better: "higher",
  },
  {
    key: "y10",
    label: "Salary at year 10",
    help: "Pay in the tenth year of work, in that year's dollars.",
    value: (r) => r.summary.salaryYear10,
    format: usdCompact,
    sub: (r) => `${usdCompact(r.summary.salaryYear10Today)} in today's dollars`,
    better: "higher",
  },
  {
    key: "cost",
    label: "College cost",
    help: "Net price after grants for all years of school, with tuition growth.",
    value: (r) => r.summary.totalCollegeCost,
    format: usdCompact,
    sub: (r) => `${usdCompact(r.summary.annualNetPrice)} a year before price growth`,
    better: "lower",
  },
  {
    key: "debt",
    label: "Student debt",
    help: "Balance at graduation, including interest accrued while enrolled.",
    value: (r) => r.summary.debtAtGraduation,
    format: usdCompact,
    sub: (r) => (r.summary.monthlyLoanPayment > 0 ? `${usd(r.summary.monthlyLoanPayment)}/mo for 10 years` : "No borrowing"),
    better: "lower",
  },
  {
    key: "disposable",
    label: "Monthly disposable",
    help: "Take-home pay minus rent, everyday costs and loan payments, first year after graduation.",
    value: (r) => r.summary.monthlyDisposable,
    format: usd,
    sub: () => "After rent, living costs and loans",
    better: "higher",
  },
  {
    key: "pp",
    label: "Purchasing power",
    help: "First-year take-home pay restated at national-average prices (BEA regional price parities).",
    value: (r) => r.summary.purchasingPower,
    format: usdCompact,
    sub: () => "Take-home at U.S.-average prices",
    better: "higher",
  },
  {
    key: "breakeven",
    label: "Breakeven",
    help: "Age when cumulative earnings net of college costs pass a high school graduate who started working at 18.",
    value: (r) => r.summary.breakevenAge,
    format: (v) => `Age ${Math.round(v)}`,
    sub: (r) => (r.summary.breakevenYearsAfterEnrollment ? `${r.summary.breakevenYearsAfterEnrollment} years after enrolling` : "Not before age 40"),
    better: "lower",
  },
  {
    key: "growth",
    label: "Job growth outlook",
    help: "Projected employment change, 2024–34 (BLS) for the chosen career; otherwise the major's typical occupations.",
    value: (_r, p) => (p.occupationId ? getOccupation(p.occupationId)?.growthPct : p.majorId ? getMajor(p.majorId)?.jobGrowth : null) ?? null,
    format: (v) => signedPct(v),
    sub: () => "Projected, 2024–34",
    better: "higher",
  },
];

function KpiGrid({ results }: { results: { path: PathConfig; result: PathResult }[] }) {
  const multi = results.length > 1;
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {KPIS.map((k) => {
        const values = results.map(({ path, result }) => k.value(result, path));
        const valid = values.filter((v): v is number => v != null);
        const best = valid.length > 1 ? (k.better === "higher" ? Math.max(...valid) : Math.min(...valid)) : null;
        const first = values[0];
        return (
          <div key={k.key} className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <dt className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
              <Tooltip content={k.help}>
                <span className="cursor-help underline decoration-border-strong decoration-dotted underline-offset-4">{k.label}</span>
              </Tooltip>
            </dt>
            {!multi ? (
              <>
                <dd className={cn("mt-2 text-2xl font-semibold tracking-tight tabular", k.key === "disposable" && first != null && first < 0 && "text-negative")}>
                  {first == null ? <span className="text-muted-foreground">—</span> : <AnimatedNumber value={first} format={k.format} />}
                </dd>
                {k.sub && <dd className="mt-1 text-xs text-muted-foreground">{k.sub(results[0].result)}</dd>}
              </>
            ) : (
              <dd className="mt-2.5 space-y-1.5">
                {results.map(({ path }, i) => {
                  const v = values[i];
                  return (
                    <div key={path.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: SERIES[i] }} />
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span
                        className={cn(
                          "text-[15px] font-semibold tabular",
                          v != null && v === best ? "text-foreground" : "text-muted-foreground",
                          k.key === "disposable" && v != null && v < 0 && "text-negative",
                        )}
                      >
                        {v == null ? "—" : <AnimatedNumber value={v} format={k.format} />}
                        {v != null && v === best && <Check className="ml-1 inline size-3.5 text-positive" aria-label="best" />}
                      </span>
                    </div>
                  );
                })}
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
