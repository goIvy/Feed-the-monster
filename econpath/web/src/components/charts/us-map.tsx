"use client";

import { scaleQuantize } from "d3-scale";
import { useState } from "react";
import { ChartTooltipCard, type TooltipRow } from "@/components/charts/chart-tooltip";
import { SEQUENTIAL_BLUE } from "@/lib/chart";
import type { UsShapes } from "@/lib/geo";
import { cn } from "@/lib/utils";

export interface UsMapProps {
  shapes: UsShapes;
  /** Value per state FIPS code. Missing states render as "no data". */
  values: Record<string, number | undefined>;
  format: (v: number) => string;
  label: string;
  selected?: string | null;
  onSelect?: (fips: string) => void;
  tooltipRows?: (fips: string) => TooltipRow[];
  className?: string;
}

/** Choropleth of the 50 states + DC on a single-hue sequential ramp, with hover and keyboard selection. */
export function UsMap({ shapes, values, format, label, selected, onSelect, tooltipRows, className }: UsMapProps) {
  const [hover, setHover] = useState<{ fips: string; x: number; y: number } | null>(null);
  const nums = Object.values(values).filter((v): v is number => v != null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const color = scaleQuantize<string>().domain([min, max]).range([...SEQUENTIAL_BLUE]);
  const bins = color.range().map((c) => ({ c, extent: color.invertExtent(c) }));
  const hovered = hover ? shapes.states.find((s) => s.fips === hover.fips) : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${shapes.width} ${shapes.height}`}
        className="h-auto w-full"
        role="group"
        aria-label={`Map of ${label} by state`}
        onPointerLeave={() => setHover(null)}
      >
        {shapes.states.map((s) => {
          const v = values[s.fips];
          const isSelected = selected === s.fips;
          return (
            <path
              key={s.fips}
              d={s.d}
              fill={v == null ? "var(--muted)" : color(v)}
              stroke={isSelected ? "var(--foreground)" : "transparent"}
              strokeWidth={isSelected ? 2 : 0}
              tabIndex={onSelect ? 0 : -1}
              role={onSelect ? "button" : undefined}
              aria-label={`${s.name}: ${v == null ? "no data" : format(v)}`}
              aria-pressed={onSelect ? isSelected : undefined}
              className="cursor-pointer outline-none transition-[fill,opacity] duration-500 hover:opacity-80 focus-visible:opacity-80"
              onPointerMove={(e) => {
                const svg = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setHover({ fips: s.fips, x: e.clientX - svg.left, y: e.clientY - svg.top });
              }}
              onClick={() => onSelect?.(s.fips)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(s.fips);
                }
              }}
            />
          );
        })}
        <path d={shapes.borders} fill="none" stroke="var(--card)" strokeWidth={0.9} strokeLinejoin="round" pointerEvents="none" />
        {selected && (
          <path
            d={shapes.states.find((s) => s.fips === selected)?.d}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </svg>

      {hover && hovered && (
        <div
          className="pointer-events-none absolute z-10 hidden sm:block"
          style={{
            left: hover.x,
            top: hover.y,
            transform: `translate(${hover.x > 480 ? "calc(-100% - 14px)" : "14px"}, -50%)`,
          }}
        >
          <ChartTooltipCard
            title={hovered.name}
            rows={
              tooltipRows?.(hovered.fips) ?? [
                { label, value: values[hovered.fips] == null ? "No data" : format(values[hovered.fips]!), emphasis: true },
              ]
            }
            footer={onSelect ? "Click for details" : undefined}
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground" aria-hidden>
        <span className="tabular">{format(min)}</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full sm:max-w-64">
          {bins.map((b) => (
            <span key={b.c} className="flex-1" style={{ background: b.c }} />
          ))}
        </div>
        <span className="tabular">{format(max)}</span>
      </div>
    </div>
  );
}
