"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SortableTable } from "@/components/data/sortable-table";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { cityBudget, monthlyLiving } from "@/lib/engine";
import { pctPoints, signedPct, usd, usdCompact } from "@/lib/format";
import { cities, stateTaxRate } from "@/services/catalog";

const SALARY = 75_000;

export function CitiesTable() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cities
      .filter((c) => (region === "All" || c.region === region) && (!t || `${c.name} ${c.state}`.toLowerCase().includes(t)))
      .map((c) => ({ c, b: cityBudget(SALARY, { city: c, stateTaxRate: stateTaxRate(c.state) }), living: monthlyLiving(c) }));
  }, [q, region]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ChipGroup aria-label="Region" value={region} onChange={setRegion} options={["All", "Northeast", "Midwest", "South", "West"].map((r) => ({ value: r, label: r }))} />
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 53 metro areas" className="pl-10" aria-label="Search cities" />
        </div>
      </div>
      <SortableTable
        caption={`Cities by cost of living and what a ${usd(SALARY)} salary buys`}
        rows={rows}
        rowId={(r) => r.c.id}
        initialSort={{ key: "pp", dir: "desc" }}
        columns={[
          { key: "name", label: "Metro area", sort: (r) => r.c.name, render: (r) => <span className="font-medium">{r.c.name}, {r.c.state}</span> },
          { key: "rpp", label: "Price level", align: "right", sort: (r) => r.c.rpp, render: (r) => r.c.rpp.toFixed(1) },
          { key: "rent", label: "1BR rent", align: "right", sort: (r) => r.c.medianRent1br, render: (r) => usd(r.c.medianRent1br) },
          { key: "living", label: "Other costs / mo", align: "right", sort: (r) => r.living.total, render: (r) => usd(r.living.total), hideBelow: "lg" },
          { key: "wage", label: "Mean wage", align: "right", sort: (r) => r.c.meanWage, render: (r) => usdCompact(r.c.meanWage), hideBelow: "md" },
          { key: "left", label: "Left / mo on $75K", align: "right", sort: (r) => r.b.leftover, render: (r) => <span className={r.b.leftover < 0 ? "text-negative" : undefined}>{r.b.leftover < 0 ? `−${usd(-r.b.leftover)}` : usd(r.b.leftover)}</span> },
          { key: "pp", label: "Buying power of $75K", align: "right", sort: (r) => r.b.purchasingPower, render: (r) => <span className="font-semibold">{usdCompact(r.b.purchasingPower)}</span> },
          { key: "unemp", label: "Unemployment", align: "right", sort: (r) => r.c.unemploymentRate, render: (r) => pctPoints(r.c.unemploymentRate), hideBelow: "xl" },
          { key: "growth", label: "Job growth (5 yr)", align: "right", sort: (r) => r.c.jobGrowth5yr, render: (r) => signedPct(r.c.jobGrowth5yr), hideBelow: "xl" },
        ]}
      />
      <p className="text-xs text-subtle-foreground">
        Price level: BEA regional price parity (U.S. = 100). Buying power: take-home pay on {usd(SALARY)} restated at U.S.-average prices. Left per month: take-home minus median one-bedroom rent and typical everyday costs.
      </p>
    </div>
  );
}
