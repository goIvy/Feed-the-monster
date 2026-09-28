"use client";

import { scaleLinear } from "d3-scale";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegend, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK } from "@/lib/chart";
import { usdCompact } from "@/lib/format";

export interface AgeSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
  points: { age: number; value: number | null }[];
}

/** Multi-series line chart over age with a shared crosshair tooltip. One y-axis, always. */
export function AgeLineChart({
  series,
  format = usdCompact,
  height = 300,
  zeroLine = false,
  markers,
  ariaLabel,
  legend = true,
}: {
  series: AgeSeries[];
  format?: (v: number) => string;
  height?: number;
  zeroLine?: boolean;
  markers?: { age: number; label: string }[];
  ariaLabel: string;
  legend?: boolean;
}) {
  const ages = series[0]?.points.map((p) => p.age) ?? [];
  const data = ages.map((age, i) => {
    const row: Record<string, number | null> = { age };
    for (const s of series) row[s.key] = s.points[i]?.value ?? null;
    return row;
  });

  const values = series.flatMap((s) => s.points.map((p) => p.value).filter((v): v is number => v != null));
  const y = scaleLinear()
    .domain([Math.min(zeroLine ? 0 : Infinity, ...values), Math.max(...values)])
    .nice(5);
  const yTicks = y.ticks(5);
  const yDomain = y.domain() as [number, number];

  return (
    <div>
      {legend && series.length > 1 && (
        <ChartLegend className="mb-3" items={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />
      )}
      <div style={{ height }} role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="age" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tickMargin={8} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => format(v)} width={58} domain={yDomain} ticks={yTicks} />
            {zeroLine && <ReferenceLine y={0} stroke="var(--chart-axis)" strokeWidth={1.25} />}
            {markers?.map((m) => (
              <ReferenceLine key={m.label} x={m.age} stroke="var(--chart-axis)" label={{ value: m.label, position: "insideTopLeft", fontSize: 11, fill: "var(--chart-label)" }} />
            ))}
            <Tooltip
              cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
              content={({ active, label, payload }) =>
                active && payload?.length ? (
                  <ChartTooltipCard
                    title={`Age ${label}`}
                    rows={series.flatMap((s) => {
                      const v = payload.find((p) => p.dataKey === s.key)?.value;
                      return v == null ? [] : [{ label: s.label, color: s.color, value: format(Number(v)) }];
                    })}
                  />
                ) : null
              }
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.dashed ? 1.75 : 2.25}
                strokeDasharray={s.dashed ? "5 4" : undefined}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--card)" }}
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
