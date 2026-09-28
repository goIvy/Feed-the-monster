"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SortableTable } from "@/components/data/sortable-table";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { pctPoints, signedPct, usdCompact } from "@/lib/format";
import { getOccupation, majors } from "@/services/catalog";
import type { Major } from "@/types/data";

const CATEGORIES = ["All", ...Array.from(new Set(majors.map((m) => m.category)))];

function SalaryRange({ m, max }: { m: Major; max: number }) {
  const x = (v: number) => `${((v / max) * 100).toFixed(2)}%`;
  return (
    <div className="relative h-5 w-40" aria-label={`Mid-career 25th to 75th percentile ${usdCompact(m.midCareerP25)} to ${usdCompact(m.midCareerP75)}`}>
      <span className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-border" />
      <span className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-chart-1/35" style={{ left: x(m.midCareerP25), width: `${(((m.midCareerP75 - m.midCareerP25) / max) * 100).toFixed(2)}%` }} />
      <span className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-3 ring-2 ring-card" style={{ left: x(m.startSalary) }} title="Early career" />
      <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-2 ring-card" style={{ left: x(m.midCareerSalary) }} title="Mid-career" />
    </div>
  );
}

export function MajorsTable() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const max = Math.max(...majors.map((m) => m.midCareerP75));
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return majors.filter((m) => (cat === "All" || m.category === cat) && (!t || `${m.name} ${m.category}`.toLowerCase().includes(t)));
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ChipGroup aria-label="Category" value={cat} onChange={setCat} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search majors" className="pl-10" aria-label="Search majors" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-chart-3" /> Early career (22–27)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-1" /> Mid-career (35–45)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-chart-1/35" /> Mid-career 25th–75th percentile
        </span>
      </div>
      <SortableTable
        caption="Majors by earnings and labor market outcomes"
        rows={rows}
        rowId={(m) => m.id}
        initialSort={{ key: "mid", dir: "desc" }}
        columns={[
          {
            key: "name",
            label: "Major",
            sort: (m) => m.name,
            render: (m) => (
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.topOccupations
                    .slice(0, 2)
                    .map((id) => getOccupation(id)?.title)
                    .join(" · ")}
                </p>
              </div>
            ),
          },
          { key: "start", label: "Early career", align: "right", sort: (m) => m.startSalary, render: (m) => usdCompact(m.startSalary) },
          { key: "mid", label: "Mid-career", align: "right", sort: (m) => m.midCareerSalary, render: (m) => <span className="font-semibold">{usdCompact(m.midCareerSalary)}</span> },
          { key: "range", label: "Pay range", render: (m) => <SalaryRange m={m} max={max} />, hideBelow: "lg" },
          { key: "unemp", label: "Unemployment", align: "right", sort: (m) => m.unemploymentRate, render: (m) => pctPoints(m.unemploymentRate) },
          { key: "under", label: "Underemployed", align: "right", sort: (m) => m.underemploymentRate, render: (m) => pctPoints(m.underemploymentRate, 0), hideBelow: "md" },
          { key: "grad", label: "Grad degree", align: "right", sort: (m) => m.gradSchoolRate, render: (m) => pctPoints(m.gradSchoolRate, 0), hideBelow: "xl" },
          { key: "growth", label: "Job growth", align: "right", sort: (m) => m.jobGrowth, render: (m) => signedPct(m.jobGrowth) },
        ]}
      />
      <p className="text-xs text-subtle-foreground">
        Underemployed: working in a job that typically does not require a bachelor&apos;s degree. Job growth: BLS 2024–34 projection for the major&apos;s typical occupations.
      </p>
    </div>
  );
}
