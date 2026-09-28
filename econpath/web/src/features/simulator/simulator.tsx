"use client";

import { ArrowRight, Flag, GraduationCap, PiggyBank, Scale, School, Wallet } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegend, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/slider-field";
import { DASHBOARD_KEY, DEFAULT_DASHBOARD, DEFAULT_EDITABLE, pathLabel, type DashboardState } from "@/features/dashboard/state";
import { useStoredState } from "@/hooks/use-stored-state";
import { AXIS_TICK, SERIES } from "@/lib/chart";
import { simulatePath } from "@/lib/engine";
import { signedPct, usd, usdCompact } from "@/lib/format";
import { buildPathInput } from "@/services/catalog";

const LAYERS = [
  { key: "taxes", label: "Taxes", color: SERIES[0] },
  { key: "rent", label: "Rent", color: SERIES[1] },
  { key: "living", label: "Everyday costs", color: SERIES[2] },
  { key: "loan", label: "Student loan", color: SERIES[3] },
  { key: "kept", label: "Savings & discretionary", color: SERIES[4] },
] as const;

export function LifePathSimulator() {
  const [state, setState] = useStoredState<DashboardState>(DASHBOARD_KEY, DEFAULT_DASHBOARD);
  const path = state.paths[0];
  const a = state.assumptions;
  const result = useMemo(
    () =>
      simulatePath(
        buildPathInput({ collegeId: path.collegeId, majorId: path.majorId, occupationId: path.occupationId, cityId: path.cityId, residency: path.residency }),
        a,
      ),
    [path, a],
  );
  const s = result.summary;
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) => setState({ ...state, assumptions: { ...a, [k]: v } });

  const firstAbove = (threshold: number) => result.rows.find((r) => r.netWorth >= threshold)?.age ?? null;
  const milestones = [
    { age: 18, label: "Start college", icon: School },
    { age: s.graduationAge, label: "Graduate", icon: GraduationCap },
    { age: s.breakevenAge, label: "Break even", icon: Scale },
    { age: s.debtFreeAge, label: s.debtAtGraduation > 0 ? "Debt-free" : "No loans", icon: Flag },
    { age: firstAbove(100_000), label: "$100K net worth", icon: PiggyBank },
    { age: firstAbove(250_000), label: "$250K net worth", icon: Wallet },
  ]
    .filter((m): m is { age: number; label: string; icon: typeof School } => m.age != null && m.age <= 40)
    // Merge milestones that land in the same year so labels never overlap.
    .reduce<{ age: number; label: string; icon: typeof School }[]>((acc, m) => {
      const same = acc.find((x) => x.age === m.age);
      if (same) same.label = `${same.label} · ${m.label}`;
      else acc.push({ ...m });
      return acc;
    }, []);

  const data = result.rows
    .filter((r) => r.phase === "work")
    .map((r) => ({
      age: r.age,
      taxes: r.taxes,
      rent: r.rent,
      living: r.living,
      loan: r.loanPayment,
      kept: Math.max(0, r.gross - r.taxes - r.rent - r.living - r.loanPayment),
      gross: r.gross,
    }));

  const x = (age: number) => ((age - 18) / 22) * 100;
  const { title, subtitle } = pathLabel(path);

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12.5px] font-semibold tracking-wide text-primary">Life Path Simulator</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[40px]">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle ? `Then ${subtitle}. ` : ""}Age 18 to 40, year by year.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            Change path or compare <ArrowRight />
          </Link>
        </Button>
      </div>

      {/* Timeline */}
      <section aria-label="Milestones" className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
        <div className="relative mx-10 hidden h-32 sm:block">
          <div className="absolute top-12 right-0 left-0 h-1 rounded-full bg-secondary" />
          <motion.div
            className="absolute top-12 left-0 h-1 rounded-full bg-gradient-to-r from-primary via-violet to-emerald"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {[18, 22, 26, 30, 34, 40].map((age) => (
            <span key={age} className="absolute bottom-0 -translate-x-1/2 text-[11px] text-subtle-foreground tabular" style={{ left: `${x(age)}%` }}>
              {age}
            </span>
          ))}
          {milestones.map((m, i) => {
            const Icon = m.icon;
            const up = i % 2 === 0;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: up ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.12 }}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${x(m.age)}%`, top: up ? 0 : 38 }}
              >
                {up && <span className="mb-1 text-[11.5px] font-medium whitespace-nowrap">{m.label}</span>}
                <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-foreground text-background shadow-soft">
                  <Icon className="size-3.5" />
                </span>
                {!up && <span className="mt-1 text-[11.5px] font-medium whitespace-nowrap">{m.label}</span>}
              </motion.div>
            );
          })}
        </div>
        <ol className="space-y-3 sm:hidden">
          {milestones.map((m) => (
            <li key={m.label} className="flex items-center gap-3 text-sm">
              <span className="w-12 font-semibold tabular">Age {m.age}</span>
              <span className="text-muted-foreground">{m.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Where every dollar goes, year by year</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Gross pay split into taxes, rent, everyday costs, loan payments and what&apos;s left. Future dollars.</p>
          <ChartLegend className="mt-4" items={LAYERS.map((l) => ({ label: l.label, color: l.color }))} />
          <div className="mt-3 h-[340px]" role="img" aria-label="Stacked area chart of annual pay by use, ages 22 to 40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="age" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} width={58} />
                <Tooltip
                  cursor={{ stroke: "var(--chart-axis)" }}
                  content={({ active, label, payload }) => {
                    const d = payload?.[0]?.payload as (typeof data)[number] | undefined;
                    return active && d ? (
                      <ChartTooltipCard
                        title={`Age ${label} · ${usd(d.gross)} gross`}
                        rows={[...LAYERS].reverse().map((l) => ({ label: l.label, color: l.color, value: usd(d[l.key]) }))}
                      />
                    ) : null;
                  }}
                />
                {LAYERS.map((l) => (
                  <Area key={l.key} type="monotone" dataKey={l.key} stackId="1" stroke="var(--card)" strokeWidth={1.5} fill={l.color} fillOpacity={0.85} animationDuration={500} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            {[
              ["Lifetime earnings to 40", usdCompact(s.lifetimeEarnings)],
              ["Total loan interest", usdCompact(s.totalInterest)],
              ["Net worth at 40", usdCompact(s.netWorthAtHorizon)],
              ["Value vs. no degree (PV)", usdCompact(s.netPresentValue)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">What if…</h2>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setState({ ...state, assumptions: DEFAULT_EDITABLE })}>
              Reset
            </button>
          </div>
          <SliderField label="Tuition" value={a.tuitionChange} min={-0.3} max={0.5} step={0.05} format={(v) => signedPct(v * 100, 0)} changed={a.tuitionChange !== 0} onChange={(v) => set("tuitionChange", v)} />
          <SliderField label="Scholarship / year" value={a.scholarshipPerYear} min={0} max={30000} step={500} format={usd} changed={a.scholarshipPerYear !== 0} onChange={(v) => set("scholarshipPerYear", v)} />
          <SliderField label="Starting salary" value={a.salaryChange} min={-0.3} max={0.3} step={0.01} format={(v) => signedPct(v * 100, 0)} changed={a.salaryChange !== 0} onChange={(v) => set("salaryChange", v)} />
          <SliderField label="Rent" value={a.rentChange} min={-0.3} max={0.5} step={0.05} format={(v) => signedPct(v * 100, 0)} changed={a.rentChange !== 0} onChange={(v) => set("rentChange", v)} />
          <SliderField label="Inflation" value={a.inflation} min={0.01} max={0.06} step={0.0025} format={(v) => `${(v * 100).toFixed(2)}%`} changed={a.inflation !== 0.025} onChange={(v) => set("inflation", v)} />
          <SliderField label="Loan interest" value={a.loanRate} min={0.03} max={0.1} step={0.0025} format={(v) => `${(v * 100).toFixed(2)}%`} changed={a.loanRate !== 0.0639} onChange={(v) => set("loanRate", v)} />
          <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Changes here are shared with your dashboard. Graduate school, family contributions and housing options are in the dashboard&apos;s full assumptions panel.
          </p>
        </aside>
      </div>
    </div>
  );
}
