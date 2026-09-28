"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SortableTable } from "@/components/data/sortable-table";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { compactNumber, signedPct, usdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { occupations } from "@/services/catalog";
import type { Occupation } from "@/types/data";

const CATEGORIES = ["All", ...Array.from(new Set(occupations.map((o) => o.category))).sort()];
const MAX = 239_200;

function WageRange({ o }: { o: Occupation }) {
  const x = (v: number) => ((v / MAX) * 100).toFixed(2);
  return (
    <Tooltip content={`10th percentile ${usdCompact(o.p10Wage)} · median ${usdCompact(o.medianWage)} · 90th percentile ${usdCompact(o.p90Wage)}${o.p90Wage >= MAX ? " (BLS cap)" : ""}`}>
      <div className="relative h-5 w-40 cursor-help">
        <span className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-border" />
        <span className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-chart-1/30" style={{ left: `${x(o.p10Wage)}%`, width: `${(((o.p90Wage - o.p10Wage) / MAX) * 100).toFixed(2)}%` }} />
        <span className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1" style={{ left: `${x(o.medianWage)}%` }} />
      </div>
    </Tooltip>
  );
}

function Exposure({ v }: { v: number }) {
  const label = v < 25 ? "Low" : v < 50 ? "Moderate" : "High";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-2.5 w-1.5 rounded-sm", i < (v < 25 ? 1 : v < 50 ? 2 : 3) ? "bg-foreground/70" : "bg-border")} />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}

export function CareersTable() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return occupations.filter((o) => (cat === "All" || o.category === cat) && (!t || `${o.title} ${o.category} ${o.socCode}`.toLowerCase().includes(t)));
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <ChipGroup aria-label="Field" value={cat} onChange={setCat} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <div className="relative shrink-0 lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 112 careers" className="pl-10" aria-label="Search careers" />
        </div>
      </div>
      <SortableTable
        caption="Occupations by wage, growth and education"
        rows={rows}
        rowId={(o) => o.id}
        initialSort={{ key: "median", dir: "desc" }}
        columns={[
          {
            key: "title",
            label: "Career",
            sort: (o) => o.title,
            render: (o) => (
              <div>
                <p className="font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  {o.category} · SOC {o.socCode}
                </p>
              </div>
            ),
          },
          { key: "median", label: "Median wage", align: "right", sort: (o) => o.medianWage, render: (o) => <span className="font-semibold">{usdCompact(o.medianWage)}</span> },
          { key: "range", label: "10th–90th pct.", render: (o) => <WageRange o={o} />, hideBelow: "lg" },
          { key: "growth", label: "Growth", align: "right", sort: (o) => o.growthPct, render: (o) => <span className={o.growthPct < 0 ? "text-negative" : undefined}>{signedPct(o.growthPct)}</span> },
          { key: "openings", label: "Openings / yr", align: "right", sort: (o) => o.annualOpenings, render: (o) => compactNumber(o.annualOpenings), hideBelow: "md" },
          { key: "edu", label: "Typical education", sort: (o) => o.education, render: (o) => <span className="text-muted-foreground">{o.education}</span>, hideBelow: "md" },
          { key: "auto", label: "Automation exposure", sort: (o) => o.automationExposure, render: (o) => <Exposure v={o.automationExposure} />, hideBelow: "xl" },
        ]}
      />
      <p className="text-xs text-subtle-foreground">
        Wages are May 2024 national estimates; BLS publishes $239,200 as a ceiling, so values at the cap are lower bounds. Automation exposure is an EconPath index (0–100) of task
        exposure to automation and AI, grouped into three bands; it is not a forecast of job loss.
      </p>
    </div>
  );
}
