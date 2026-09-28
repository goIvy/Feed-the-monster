"use client";

import { scaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { SERIES } from "@/lib/chart";
import { usdCompact } from "@/lib/format";
import { useElementWidth } from "@/hooks/use-element-size";
import { cn } from "@/lib/utils";
import { BRANCH_PATHS, runDemo } from "./demo-paths";


/** Five real simulated paths fanning out from age 18: net worth by age, drawn in as they scroll into view. */
export function LifePaths() {
  const [wrapRef, W] = useElementWidth<HTMLDivElement>(1000);
  const compact = W < 640;
  const H = compact ? 280 : 340;
  const M = { top: 24, right: compact ? 12 : 200, bottom: 30, left: 46 };
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hoverAge, setHoverAge] = useState<number | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const paths = useMemo(
    () =>
      BRANCH_PATHS.map((p, i) => {
        const result = runDemo(p);
        return { ...p, color: SERIES[i], points: result.rows.map((r) => ({ age: r.age, value: r.netWorth })) };
      }),
    [],
  );

  const all = paths.flatMap((p) => p.points.map((d) => d.value));
  const x = scaleLinear().domain([18, 40]).range([M.left, W - M.right]);
  const y = scaleLinear()
    .domain([Math.min(0, ...all), Math.max(...all)])
    .nice()
    .range([H - M.bottom, M.top]);
  const gen = line<{ age: number; value: number }>()
    .x((d) => x(d.age))
    .y((d) => y(d.value))
    .curve(curveMonotoneX);

  // Spread end labels so they never collide.
  const ends = paths
    .map((p) => ({ key: p.key, y: y(p.points[p.points.length - 1].value) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 34);
  const labelY = Object.fromEntries(ends.map((e) => [e.key, e.y]));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const age = Math.round(x.invert(px));
    setHoverAge(age >= 18 && age <= 40 ? age : null);
  };

  const hoverRows =
    hoverAge == null
      ? null
      : paths
          .map((p) => ({ p, v: p.points.find((d) => d.age === hoverAge)!.value }))
          .sort((a, b) => b.v - a.v);

  return (
    <figure className="relative">
      <div ref={wrapRef}>
      <svg
        ref={ref}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block touch-pan-y overflow-visible"
        role="img"
        aria-labelledby="life-paths-title life-paths-desc"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverAge(null)}
      >
        <title id="life-paths-title">Projected net worth from age 18 to 40 for five education paths</title>
        <desc id="life-paths-desc">
          {paths.map((p) => `${p.label} at ${p.short}: ${usdCompact(p.points[p.points.length - 1].value)} at 40`).join("; ")}
        </desc>
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--chart-axis)" : "var(--chart-grid)"} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--chart-label)] text-[11px] tabular">
              {usdCompact(t)}
            </text>
          </g>
        ))}
        {(compact ? [18, 22, 30, 40] : [18, 22, 26, 30, 34, 40]).map((a) => (
          <text key={a} x={x(a)} y={H - 8} textAnchor="middle" className="fill-[var(--chart-label)] text-[11px]">
            {a === 18 ? "Age 18" : a}
          </text>
        ))}
        <rect x={x(18)} y={M.top} width={x(22) - x(18)} height={H - M.top - M.bottom} fill="var(--muted)" opacity={0.6} rx={6} />
        <text x={(x(18) + x(22)) / 2} y={M.top + 16} textAnchor="middle" className="fill-[var(--chart-label)] text-[11px]">
          College
        </text>

        {paths.map((p, i) => {
          const dimmed = focus != null && focus !== p.key;
          const last = p.points[p.points.length - 1];
          return (
            <g key={p.key} opacity={dimmed ? 0.18 : 1} className="transition-opacity duration-300">
              <motion.path
                d={gen(p.points) ?? ""}
                fill="none"
                stroke={p.color}
                strokeWidth={2.25}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: inView ? 1 : 0 }}
                transition={{ duration: 1.6, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: inView ? 1 : 0 }} transition={{ delay: 1.2 + 0.15 * i }}>
                <circle cx={x(last.age)} cy={y(last.value)} r={4.5} fill={p.color} stroke="var(--card)" strokeWidth={2} />
                {!compact && (
                <>
                <line x1={x(last.age) + 6} x2={x(last.age) + 14} y1={y(last.value)} y2={labelY[p.key]} stroke="var(--chart-axis)" />
                <text x={x(last.age) + 18} y={labelY[p.key] - 4} className="fill-[var(--foreground)] text-[12.5px] font-medium">
                  {p.label} · {p.short}
                </text>
                <text x={x(last.age) + 18} y={labelY[p.key] + 11} className="fill-[var(--chart-label)] text-[11.5px] tabular">
                  {usdCompact(last.value)} in {p.place}
                </text>
                </>
                )}
              </motion.g>
            </g>
          );
        })}
        <circle cx={x(18)} cy={y(0)} r={5} fill="var(--foreground)" stroke="var(--card)" strokeWidth={2} />

        {hoverAge != null && (
          <g pointerEvents="none">
            <line x1={x(hoverAge)} x2={x(hoverAge)} y1={M.top} y2={H - M.bottom} stroke="var(--chart-axis)" />
            {paths.map((p) => (
              <circle
                key={p.key}
                cx={x(hoverAge)}
                cy={y(p.points.find((d) => d.age === hoverAge)!.value)}
                r={3.5}
                fill={p.color}
                stroke="var(--card)"
                strokeWidth={1.5}
              />
            ))}
          </g>
        )}
      </svg>
      </div>

      {hoverRows && hoverAge != null && (
        <div
          className="pointer-events-none absolute top-2 hidden sm:block"
          style={{ left: `${(x(hoverAge) / W) * 100}%`, transform: hoverAge > 30 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
        >
          <ChartTooltipCard
            title={`Age ${hoverAge} · net worth`}
            rows={hoverRows.map(({ p, v }) => ({ label: `${p.label} · ${p.short}`, value: usdCompact(v), color: p.color }))}
          />
        </div>
      )}

      <figcaption className="mt-4 flex flex-wrap items-center gap-2">
        {paths.map((p) => (
          <button
            key={p.key}
            type="button"
            onMouseEnter={() => setFocus(p.key)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(p.key)}
            onBlur={() => setFocus(null)}
            className={cn(
              "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft transition hover:text-foreground",
              focus === p.key && "border-border-strong text-foreground",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.label} · {p.short}
            <span className="tabular text-subtle-foreground">{usdCompact(p.points[p.points.length - 1].value)} at 40</span>
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
