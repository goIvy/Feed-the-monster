"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string;
  className?: string;
  hideBelow?: "md" | "lg" | "xl";
}

const HIDE = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

/** Accessible table with clickable, keyboard-operable sort headers. Rows get `id` anchors for deep links. */
export function SortableTable<T>({
  rows,
  columns,
  rowId,
  initialSort,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  rowId: (row: T) => string;
  initialSort: { key: string; dir: "asc" | "desc" };
  caption: string;
}) {
  const [sort, setSort] = useState(initialSort);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sort]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
          <tr>
            {columns.map((c) => {
              const active = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-4 py-3 font-medium whitespace-nowrap first:pl-5", c.align === "right" ? "text-right" : "text-left", c.hideBelow && HIDE[c.hideBelow])}
                >
                  {c.sort ? (
                    <button
                      type="button"
                      onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "desc" ? "asc" : "desc" }))}
                      className={cn("inline-flex items-center gap-1 rounded hover:text-foreground", active && "text-foreground")}
                    >
                      {c.label}
                      {active ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row) => (
            <tr key={rowId(row)} id={rowId(row)} className="scroll-mt-24 transition-colors hover:bg-muted/40 target:bg-accent/60">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 first:pl-5", c.align === "right" && "text-right tabular", c.className, c.hideBelow && HIDE[c.hideBelow])}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
