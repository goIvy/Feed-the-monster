"use client";

import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UsMap } from "@/components/charts/us-map";
import { ChipGroup } from "@/components/ui/chip-group";
import { pctPoints, signedPct, usd, usdCompact } from "@/lib/format";
import type { UsShapes } from "@/lib/geo";
import { states } from "@/services/catalog";
import type { State } from "@/types/data";

type LayerKey = "income" | "pp" | "rent" | "unemployment" | "youth" | "growth" | "wages" | "tuition";

const LAYERS: { key: LayerKey; label: string; get: (s: State) => number; format: (v: number) => string; note: string; higherIsBetter: boolean }[] = [
  { key: "income", label: "Income", get: (s) => s.medianHouseholdIncome, format: usdCompact, note: "Median household income (ACS 2024)", higherIsBetter: true },
  { key: "pp", label: "Purchasing power", get: (s) => s.medianHouseholdIncome / (s.rpp / 100), format: usdCompact, note: "Median household income ÷ regional price parity", higherIsBetter: true },
  { key: "rent", label: "Rent", get: (s) => s.medianRent, format: usd, note: "Median gross rent per month (ACS 2024)", higherIsBetter: false },
  { key: "unemployment", label: "Unemployment", get: (s) => s.unemploymentRate, format: (v) => pctPoints(v), note: "Unemployment rate, 2025 annual average (BLS LAUS)", higherIsBetter: false },
  { key: "youth", label: "Youth unemployment", get: (s) => s.youthUnemploymentRate, format: (v) => pctPoints(v), note: "Unemployment, ages 16–24 (ACS 2024)", higherIsBetter: false },
  { key: "growth", label: "Job growth", get: (s) => s.jobGrowth5yr, format: (v) => signedPct(v), note: "Nonfarm payroll growth over five years (BLS)", higherIsBetter: true },
  { key: "wages", label: "Wage growth", get: (s) => s.wageGrowth, format: (v) => pctPoints(v), note: "Average annual wage growth (BLS)", higherIsBetter: true },
  { key: "tuition", label: "College cost", get: (s) => s.publicTuitionInState, format: usd, note: "Average in-state tuition at public four-year colleges (IPEDS)", higherIsBetter: false },
];

const byFips = new Map(states.map((s) => [s.fips, s]));

function rank(layer: (typeof LAYERS)[number], s: State) {
  const sorted = [...states].sort((a, b) => (layer.higherIsBetter ? layer.get(b) - layer.get(a) : layer.get(a) - layer.get(b)));
  return sorted.findIndex((x) => x.code === s.code) + 1;
}

export function OpportunityMap({ shapes }: { shapes: UsShapes }) {
  const [layerKey, setLayerKey] = useState<LayerKey>("pp");
  const [selected, setSelected] = useState<string | null>("48");
  const layer = LAYERS.find((l) => l.key === layerKey)!;
  const values = useMemo(() => Object.fromEntries(states.map((s) => [s.fips, layer.get(s)])), [layer]);
  const state = selected ? byFips.get(selected) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <ChipGroup aria-label="Map layer" value={layerKey} onChange={setLayerKey} options={LAYERS.map((l) => ({ value: l.key, label: l.label }))} />
        <p className="mt-3 text-xs text-muted-foreground">{layer.note}. Darker means higher.</p>
        <UsMap
          className="mt-3"
          shapes={shapes}
          values={values}
          format={layer.format}
          label={layer.label}
          selected={selected}
          onSelect={setSelected}
          tooltipRows={(fips) => {
            const s = byFips.get(fips)!;
            return [
              { label: layer.label, value: layer.format(layer.get(s)), emphasis: true },
              { label: "National rank", value: `${rank(layer, s)} of 51` },
            ];
          }}
        />
      </div>

      <aside aria-live="polite" className="rounded-2xl border border-border bg-card p-5 shadow-card">
        {state ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{state.region}</p>
                <h3 className="text-xl font-semibold tracking-tight">{state.name}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Clear selection" className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <dl className="mt-4 divide-y divide-border text-sm">
              {LAYERS.map((l) => (
                <div key={l.key} className="flex items-center justify-between py-2">
                  <dt className={l.key === layerKey ? "font-medium text-foreground" : "text-muted-foreground"}>{l.label}</dt>
                  <dd className="flex items-center gap-2 tabular">
                    {l.format(l.get(state))}
                    <span className="w-9 text-right text-[11px] text-subtle-foreground">#{rank(l, state)}</span>
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <dt className="text-muted-foreground">Price level (U.S. = 100)</dt>
                <dd className="tabular">{state.rpp.toFixed(1)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-subtle-foreground">Ranks: 1 = most favorable for a young worker on that measure.</p>
            <Link href="/cities" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Explore cities <ArrowUpRight className="size-3.5" />
            </Link>
          </>
        ) : (
          <div className="grid h-full place-items-center py-10 text-center text-sm text-muted-foreground">
            Select a state on the map to see its full economic profile.
          </div>
        )}
      </aside>
    </div>
  );
}
