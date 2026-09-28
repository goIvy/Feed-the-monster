"use client";

import { cn } from "@/lib/utils";

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  emphasis?: boolean;
}

/** Card-style tooltip body shared by all charts. Values use ink colors; the swatch carries identity. */
export function ChartTooltipCard({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
  return (
    <div className="min-w-44 rounded-xl border border-border bg-popover/95 px-3 py-2.5 text-xs shadow-lift backdrop-blur">
      <div className="mb-1.5 font-medium text-foreground">{title}</div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              {r.color && <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />}
              <span className="truncate">{r.label}</span>
            </span>
            <span className={cn("tabular text-foreground", r.emphasis && "font-semibold")}>{r.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-2 border-t border-border pt-1.5 text-[11px] text-subtle-foreground">{footer}</div>}
    </div>
  );
}

export function ChartLegend({ items, className }: { items: { label: string; color: string; dashed?: boolean }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.dashed ? (
            <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="h-[3px] w-3.5 rounded-full" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
