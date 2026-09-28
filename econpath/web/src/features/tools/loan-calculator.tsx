"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegend, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SliderField } from "@/components/ui/slider-field";
import { AXIS_TICK, SERIES } from "@/lib/chart";
import { amortize } from "@/lib/engine";
import { usd, usdCompact } from "@/lib/format";

export function LoanCalculator() {
  const [principal, setPrincipal] = useState(27_000);
  const [rate, setRate] = useState(0.0639);
  const [years, setYears] = useState(10);
  const [extra, setExtra] = useState(0);
  const base = useMemo(() => amortize(principal, rate, years), [principal, rate, years]);
  const plan = useMemo(() => amortize(principal, rate, years, extra), [principal, rate, years, extra]);
  const data = plan.years.map((y) => ({ year: `Yr ${y.year}`, principal: y.principal, interest: y.interest, balance: y.balance }));
  const saved = base.totalInterest - plan.totalInterest;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-5">
        <SliderField label="Loan balance" value={principal} min={1000} max={150000} step={500} format={usd} onChange={setPrincipal} />
        <SliderField label="Interest rate" value={rate} min={0.02} max={0.12} step={0.0025} format={(v) => `${(v * 100).toFixed(2)}%`} onChange={setRate} />
        <SliderField label="Repayment term" value={years} min={5} max={25} step={1} format={(v) => `${v} years`} onChange={setYears} />
        <SliderField label="Extra per month" value={extra} min={0} max={1000} step={25} format={usd} onChange={setExtra} changed={extra > 0} />
      </div>
      <div className="min-w-0">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Monthly payment", v: plan.monthlyPayment, f: usd },
            { k: "Total interest", v: plan.totalInterest, f: usdCompact },
            { k: "Paid off in", v: plan.months / 12, f: (n: number) => `${n.toFixed(1)} yrs` },
            { k: "Interest saved", v: saved, f: usdCompact },
          ].map(({ k, v, f }) => (
            <div key={k} className="rounded-xl border border-border bg-background-elevated p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-lg font-semibold tabular">
                <AnimatedNumber value={v} format={f} />
              </dd>
            </div>
          ))}
        </dl>
        <ChartLegend
          className="mt-5"
          items={[
            { label: "Principal", color: SERIES[0] },
            { label: "Interest", color: SERIES[1] },
          ]}
        />
        <div className="mt-3 h-64" role="img" aria-label="Principal and interest paid each year">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} width={52} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, label, payload }) => {
                  const d = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  return active && d ? (
                    <ChartTooltipCard
                      title={String(label)}
                      rows={[
                        { label: "Principal", value: usd(d.principal), color: SERIES[0] },
                        { label: "Interest", value: usd(d.interest), color: SERIES[1] },
                        { label: "Balance after", value: usd(d.balance), emphasis: true },
                      ]}
                    />
                  ) : null;
                }}
              />
              <Bar dataKey="principal" stackId="a" fill={SERIES[0]} stroke="var(--card)" strokeWidth={1} />
              <Bar dataKey="interest" stackId="a" fill={SERIES[1]} stroke="var(--card)" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
