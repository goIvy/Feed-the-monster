"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK, MUTED_SERIES } from "@/lib/chart";
import { compactNumber, signedPct, usd, usdCompact } from "@/lib/format";
import { ChipGroup } from "@/components/ui/chip-group";
import { occupations } from "@/services/catalog";

const CATEGORIES = ["All", "Computer & Math", "Healthcare", "Engineering", "Business & Finance", "Education", "Skilled Trades"];

export function CareerPreview() {
  const [category, setCategory] = useState("All");
  const data = useMemo(
    () =>
      occupations.map((o) => ({
        id: o.id,
        title: o.title,
        category: o.category,
        wage: o.medianWage,
        growth: o.growthPct,
        employment: o.employment,
        education: o.education,
        active: category === "All" || o.category === category,
      })),
    [category],
  );
  const active = data.filter((d) => d.active);
  const inactive = data.filter((d) => !d.active);
  const top = [...active].sort((a, b) => b.wage * (1 + b.growth / 100) - a.wage * (1 + a.growth / 100)).slice(0, 4);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <ChipGroup aria-label="Filter careers by field" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <div className="mt-4 h-[320px]" role="img" aria-label={`Median wage versus projected growth for ${active.length} careers`}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 4 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="growth"
                name="Projected growth"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[-10, 50]}
                ticks={[-10, 0, 10, 20, 30, 40, 50]}
                label={{ value: "Projected job growth, 2024–34", position: "insideBottom", offset: -10, fontSize: 11, fill: "var(--chart-label)" }}
              />
              <YAxis type="number" dataKey="wage" name="Median wage" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} width={56} />
              <ZAxis type="number" dataKey="employment" range={[30, 420]} />
              <ReferenceLine x={0} stroke="var(--chart-axis)" />
              <Tooltip
                cursor={false}
                content={({ active: on, payload }) => {
                  const d = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  return on && d ? (
                    <ChartTooltipCard
                      title={d.title}
                      rows={[
                        { label: "Median wage", value: usd(d.wage), emphasis: true },
                        { label: "Projected growth", value: signedPct(d.growth) },
                        { label: "Employment", value: compactNumber(d.employment) },
                        { label: "Typical education", value: d.education },
                      ]}
                    />
                  ) : null;
                }}
              />
              <Scatter data={inactive} fill={MUTED_SERIES} fillOpacity={0.45} isAnimationActive={false} />
              <Scatter data={active} fill="var(--chart-1)" fillOpacity={0.72} stroke="var(--card)" strokeWidth={1.5} animationDuration={500} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-subtle-foreground">Bubble size shows current employment. Wages at the BLS $239,200 reporting cap are lower bounds.</p>
      </div>

      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h3 className="text-[15px] font-semibold tracking-tight">High pay and strong growth</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">{category === "All" ? "Across all fields" : category}, ranked by median wage × (1 + growth).</p>
        <ol className="mt-4 space-y-2">
          {top.map((o, i) => (
            <li key={o.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="grid size-7 place-items-center rounded-lg bg-muted text-xs font-semibold tabular text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.education}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular">{usdCompact(o.wage)}</p>
                <p className="text-xs text-positive tabular">{signedPct(o.growth)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
