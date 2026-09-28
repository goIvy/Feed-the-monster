import { cn } from "@/lib/utils";

/** Accessible table view that accompanies a chart. */
export function ChartDataTable({
  caption,
  columns,
  rows,
  className,
}: {
  caption: string;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, React.ReactNode>[];
  className?: string;
}) {
  return (
    <div className={cn("max-h-80 overflow-auto rounded-xl border border-border", className)}>
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-3 py-2 font-medium whitespace-nowrap", c.align === "right" && "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/50">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-1.5 whitespace-nowrap tabular", c.align === "right" && "text-right")}>
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
