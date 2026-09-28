"use client";

import { ArrowDownUp, ArrowRight, Check, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartLegend, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { SliderField } from "@/components/ui/slider-field";
import { useStoredState } from "@/hooks/use-stored-state";
import { AXIS_TICK, SERIES } from "@/lib/chart";
import type { Residency } from "@/lib/engine";
import { compactNumber, number, pct, usd, usdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { states } from "@/services/catalog";
import { majorOptions } from "@/services/options";
import { allCollegeMetrics, type CollegeMetrics } from "./metrics";

export const COMPARE_KEY = "econpath:compare:v1";
export const MAX_COMPARE = 5;
const EMPTY_IDS: string[] = [];
const stateName = (code: string) => states.find((s) => s.code === code)?.name ?? code;

type SortKey = "roi" | "npv" | "earnings" | "netPrice" | "debt" | "gradRate" | "breakeven" | "name";
type SizeKey = "any" | "small" | "medium" | "large" | "xl";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "roi", label: "Highest ROI" },
  { value: "npv", label: "Net value to age 40" },
  { value: "earnings", label: "Highest earnings" },
  { value: "netPrice", label: "Lowest net price" },
  { value: "debt", label: "Lowest debt" },
  { value: "gradRate", label: "Graduation rate" },
  { value: "breakeven", label: "Fastest breakeven" },
  { value: "name", label: "Name (A–Z)" },
];

const SIZES: Record<SizeKey, { label: string; test: (n: number) => boolean }> = {
  any: { label: "Any size", test: () => true },
  small: { label: "Under 5,000", test: (n) => n < 5000 },
  medium: { label: "5,000–15,000", test: (n) => n >= 5000 && n < 15000 },
  large: { label: "15,000–30,000", test: (n) => n >= 15000 && n < 30000 },
  xl: { label: "30,000+", test: (n) => n >= 30000 },
};

interface Filters {
  state: string;
  control: "all" | "public" | "private";
  maxNetPrice: number;
  size: SizeKey;
  minGradRate: number;
  minEarnings: number;
  maxDebt: number;
  minRoi: number;
}

const DEFAULT_FILTERS: Filters = {
  state: "all",
  control: "all",
  maxNetPrice: 60000,
  size: "any",
  minGradRate: 0.6,
  minEarnings: 40000,
  maxDebt: 30000,
  minRoi: -1,
};

function sortValue(m: CollegeMetrics, key: SortKey): number | string {
  switch (key) {
    case "roi":
      return -m.roi;
    case "npv":
      return -m.npv;
    case "earnings":
      return -m.college.medianEarnings10yr;
    case "netPrice":
      return m.netPrice;
    case "debt":
      return m.debt;
    case "gradRate":
      return -m.college.gradRate;
    case "breakeven":
      return m.breakevenAge ?? 99;
    case "name":
      return m.college.shortName;
  }
}

export function CollegeExplorer() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [majorId, setMajorId] = useState<string | null>(null);
  const [residency, setResidency] = useState<Residency>("in-state");
  const [sort, setSort] = useState<SortKey>("roi");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [compare, setCompare] = useStoredState<string[]>(COMPARE_KEY, EMPTY_IDS);

  const metrics = useMemo(() => allCollegeMetrics({ majorId, residency }), [majorId, residency]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return metrics
      .filter(({ college: c, ...m }) => {
        if (q && !`${c.name} ${c.shortName} ${c.state} ${m.metroName}`.toLowerCase().includes(q)) return false;
        if (filters.state !== "all" && c.state !== filters.state) return false;
        if (filters.control !== "all" && c.control !== filters.control) return false;
        if (filters.maxNetPrice < 60000 && m.netPrice > filters.maxNetPrice) return false;
        if (!SIZES[filters.size].test(c.undergradSize)) return false;
        if (filters.minGradRate > 0.6 && c.gradRate < filters.minGradRate) return false;
        if (filters.minEarnings > 40000 && c.medianEarnings10yr < filters.minEarnings) return false;
        if (filters.maxDebt < 30000 && m.debt > filters.maxDebt) return false;
        if (filters.minRoi > -1 && m.roi < filters.minRoi) return false;
        return true;
      })
      .sort((a, b) => {
        const va = sortValue(a, sort);
        const vb = sortValue(b, sort);
        return typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      });
  }, [metrics, deferredQuery, filters, sort]);

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id]));

  const activeFilterCount = (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter((k) => filters[k] !== DEFAULT_FILTERS[k]).length;
  const compareHref = `/colleges/compare?ids=${compare.join(",")}${majorId ? `&major=${majorId}` : ""}${residency === "out-of-state" ? "&res=out" : ""}`;
  const medianRoi = filtered.length ? [...filtered].sort((a, b) => a.roi - b.roi)[Math.floor(filtered.length / 2)].roi : 0;

  const filterPanel = <FilterPanel filters={filters} setFilters={setFilters} />;

  return (
    <div className="container-page pt-8 pb-28">
      {/* Toolbar */}
      <div className="grid gap-3 md:grid-cols-[1fr_240px_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search colleges, cities or states" className="h-11 pl-10" aria-label="Search colleges" />
        </div>
        <Combobox aria-label="Major lens" options={majorOptions} value={majorId} onChange={setMajorId} placeholder="All majors (college median)" allowClear searchPlaceholder="Search majors" className="[&_button]:h-11" />
        <Segmented<Residency>
          aria-label="Residency"
          layoutId="explorer-res"
          value={residency}
          onChange={setResidency}
          options={[
            { value: "in-state", label: "In-state" },
            { value: "out-of-state", label: "Out-of-state" },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5 shadow-soft">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground tabular">{filtered.length}</span> of {metrics.length} colleges
              {filtered.length > 0 && (
                <>
                  {" · "}median ROI <span className="font-medium text-foreground tabular">{pct(medianRoi)}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal /> Filters
                    {activeFilterCount > 0 && <Badge className="ml-0.5 px-1.5">{activeFilterCount}</Badge>}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85dvh] overflow-y-auto p-5">
                  <DialogTitle className="mb-4 text-base font-semibold">Filters</DialogTitle>
                  {filterPanel}
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <ArrowDownUp className="size-3.5 text-muted-foreground" aria-hidden />
                <Select aria-label="Sort by" value={sort} onValueChange={(v) => setSort(v as SortKey)} options={SORTS} className="h-9 w-48" />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">Net price vs. earnings ten years after entry</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">Each bubble is a college, sized by enrollment. Click one to add it to your comparison.</p>
              </div>
              <ChartLegend
                items={[
                  { label: "Public", color: SERIES[0] },
                  { label: "Private", color: SERIES[1] },
                ]}
              />
            </div>
            <PriceEarningsScatter data={filtered} selected={compare} onToggle={toggleCompare} />
          </div>

          <ResultsList results={filtered} selected={compare} onToggle={toggleCompare} lensLabel={majorId ? majorOptions.find((m) => m.value === majorId)?.label : null} />
          {filtered.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border-strong p-10 text-center">
              <p className="font-medium">No colleges match these filters.</p>
              <Button variant="link" onClick={() => (setFilters(DEFAULT_FILTERS), setQuery(""))}>
                Reset filters and search
              </Button>
            </div>
          )}
        </div>
      </div>

      <CompareTray ids={compare} onRemove={toggleCompare} onClear={() => setCompare([])} href={compareHref} />
    </div>
  );
}

function FilterPanel({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });
  const stateOptions = [{ value: "all", label: "All states" }, ...states.map((s) => ({ value: s.code, label: s.name }))];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs text-muted-foreground hover:text-foreground">
          Reset
        </button>
      </div>
      <div className="space-y-1.5">
        <p className="text-[13px] text-muted-foreground">State</p>
        <Select aria-label="State" value={filters.state} onValueChange={(v) => set("state", v)} options={stateOptions} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[13px] text-muted-foreground">School type</p>
        <Segmented
          aria-label="School type"
          layoutId="filter-control"
          size="sm"
          className="w-full [&>*]:flex-1"
          value={filters.control}
          onChange={(v) => set("control", v)}
          options={[
            { value: "all", label: "All" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[13px] text-muted-foreground">Undergraduate size</p>
        <Select aria-label="Size" value={filters.size} onValueChange={(v) => set("size", v as SizeKey)} options={Object.entries(SIZES).map(([value, s]) => ({ value, label: s.label }))} className="h-9" />
      </div>
      <SliderField label="Max net price / yr" value={filters.maxNetPrice} min={5000} max={60000} step={1000} format={(v) => (v >= 60000 ? "Any" : usdCompact(v))} onChange={(v) => set("maxNetPrice", v)} changed={filters.maxNetPrice !== DEFAULT_FILTERS.maxNetPrice} />
      <SliderField label="Min graduation rate" value={filters.minGradRate} min={0.6} max={0.98} step={0.01} format={(v) => (v <= 0.6 ? "Any" : pct(v))} onChange={(v) => set("minGradRate", v)} changed={filters.minGradRate !== DEFAULT_FILTERS.minGradRate} />
      <SliderField label="Min earnings, yr 10" value={filters.minEarnings} min={40000} max={120000} step={1000} format={(v) => (v <= 40000 ? "Any" : usdCompact(v))} onChange={(v) => set("minEarnings", v)} changed={filters.minEarnings !== DEFAULT_FILTERS.minEarnings} />
      <SliderField label="Max debt" value={filters.maxDebt} min={5000} max={30000} step={500} format={(v) => (v >= 30000 ? "Any" : usdCompact(v))} onChange={(v) => set("maxDebt", v)} changed={filters.maxDebt !== DEFAULT_FILTERS.maxDebt} help="Estimated balance at graduation, including interest accrued while enrolled." />
      <SliderField label="Min ROI to age 40" value={filters.minRoi} min={-1} max={4} step={0.1} format={(v) => (v <= -1 ? "Any" : pct(v))} onChange={(v) => set("minRoi", v)} changed={filters.minRoi !== DEFAULT_FILTERS.minRoi} help="Net present value to age 40 divided by the present value of costs and forgone earnings." />
    </div>
  );
}

function PriceEarningsScatter({ data, selected, onToggle }: { data: CollegeMetrics[]; selected: string[]; onToggle: (id: string) => void }) {
  const points = data.map((m) => ({
    id: m.college.id,
    name: m.college.shortName,
    control: m.college.control,
    x: m.netPrice,
    y: m.college.medianEarnings10yr,
    z: m.college.undergradSize,
    m,
  }));
  const shape = (color: string) =>
    function Dot(props: unknown) {
      const { cx, cy, size, payload } = props as { cx: number; cy: number; size: number; payload: (typeof points)[number] };
      const r = Math.sqrt(size / Math.PI);
      const isSel = selected.includes(payload.id);
      return (
        <g className="cursor-pointer" onClick={() => onToggle(payload.id)}>
          <circle cx={cx} cy={cy} r={r + (isSel ? 3 : 0)} fill={isSel ? "var(--foreground)" : "transparent"} />
          <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={isSel ? 1 : 0.7} stroke="var(--card)" strokeWidth={1.5} />
          {isSel && (
            <text x={cx} y={cy - r - 7} textAnchor="middle" className="fill-[var(--foreground)] text-[11px] font-medium">
              {payload.name}
            </text>
          )}
        </g>
      );
    };

  return (
    <div className="mt-4 h-[340px]" role="img" aria-label={`Scatter of ${points.length} colleges by net price and earnings`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 12, bottom: 16, left: 4 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => usdCompact(v)}
            domain={[0, "auto"]}
            label={{ value: "Average net price per year", position: "insideBottom", offset: -10, fontSize: 11, fill: "var(--chart-label)" }}
          />
          <YAxis type="number" dataKey="y" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} width={56} domain={["auto", "auto"]} />
          <ZAxis type="number" dataKey="z" range={[40, 520]} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof points)[number] | undefined;
              return active && p ? (
                <ChartTooltipCard
                  title={p.m.college.name}
                  rows={[
                    { label: "Net price / yr", value: usd(p.x) },
                    { label: "Earnings, yr 10", value: usd(p.y), emphasis: true },
                    { label: "ROI to 40", value: pct(p.m.roi) },
                    { label: "Undergraduates", value: number(p.z) },
                  ]}
                  footer={selected.includes(p.id) ? "Click to remove from comparison" : "Click to compare"}
                />
              ) : null;
            }}
          />
          <Scatter data={points.filter((p) => p.control === "public")} shape={shape(SERIES[0])} isAnimationActive={false} />
          <Scatter data={points.filter((p) => p.control === "private")} shape={shape(SERIES[1])} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function RoiBar({ roi, max }: { roi: number; max: number }) {
  const w = Math.min(100, (Math.abs(roi) / max) * 100);
  return (
    <div className="flex items-center justify-end gap-2">
      <span className={cn("w-12 text-right font-semibold tabular", roi < 0 && "text-negative")}>{pct(roi)}</span>
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted xl:block" aria-hidden>
        <span className={cn("block h-full rounded-full", roi < 0 ? "bg-chart-2" : "bg-chart-1")} style={{ width: `${w.toFixed(2)}%` }} />
      </span>
    </div>
  );
}

function ResultsList({
  results,
  selected,
  onToggle,
  lensLabel,
}: {
  results: CollegeMetrics[];
  selected: string[];
  onToggle: (id: string) => void;
  lensLabel?: string | null;
}) {
  const [limit, setLimit] = useState(20);
  const shown = results.slice(0, limit);
  const maxRoi = Math.max(1, ...results.map((r) => Math.abs(r.roi)));
  const full = selected.length >= MAX_COMPARE;

  const CompareButton = ({ id, name }: { id: string; name: string }) => {
    const on = selected.includes(id);
    return (
      <button
        type="button"
        onClick={() => onToggle(id)}
        disabled={!on && full}
        aria-pressed={on}
        aria-label={on ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border transition disabled:opacity-40",
          on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        {on ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
    );
  };

  return (
    <div className="mt-4">
      {lensLabel && <p className="mb-3 text-xs text-muted-foreground">Earnings, ROI and breakeven shown for {lensLabel} majors at each college.</p>}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="w-14 py-3 pr-2 pl-4">
                <span className="sr-only">Compare</span>
              </th>
              <th scope="col" className="py-3 font-medium">College</th>
              <th scope="col" className="py-3 text-right font-medium">Net price</th>
              <th scope="col" className="py-3 text-right font-medium">Earnings</th>
              <th scope="col" className="py-3 text-right font-medium">Debt</th>
              <th scope="col" className="hidden py-3 text-right font-medium xl:table-cell">Grad rate</th>
              <th scope="col" className="py-3 text-right font-medium">Breakeven</th>
              <th scope="col" className="py-3 pr-5 text-right font-medium">ROI to 40</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((m) => (
              <tr key={m.college.id} className={cn("transition-colors hover:bg-muted/40", selected.includes(m.college.id) && "bg-accent/40")}>
                <td className="py-3 pr-2 pl-4">
                  <CompareButton id={m.college.id} name={m.college.shortName} />
                </td>
                <td className="py-3 pr-3">
                  <Link href={`/colleges/${m.college.id}`} className="font-medium hover:text-primary hover:underline">
                    {m.college.shortName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {stateName(m.college.state)} · {m.college.control === "public" ? "Public" : "Private"} · {compactNumber(m.college.undergradSize)} students
                  </p>
                </td>
                <td className="py-3 text-right tabular">{usdCompact(m.netPrice)}</td>
                <td className="py-3 text-right tabular">{usdCompact(m.college.medianEarnings10yr)}</td>
                <td className="py-3 text-right tabular">{usdCompact(m.debt)}</td>
                <td className="hidden py-3 text-right tabular xl:table-cell">{pct(m.college.gradRate)}</td>
                <td className="py-3 text-right tabular">{m.breakevenAge ? `Age ${m.breakevenAge}` : "40+"}</td>
                <td className="py-3 pr-5">
                  <RoiBar roi={m.roi} max={maxRoi} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {shown.map((m) => (
          <li key={m.college.id} className={cn("rounded-2xl border border-border bg-card p-4 shadow-soft", selected.includes(m.college.id) && "border-primary/40")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/colleges/${m.college.id}`} className="font-semibold hover:text-primary">
                  {m.college.shortName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {m.college.state} · {m.college.control === "public" ? "Public" : "Private"} · Grad {pct(m.college.gradRate)}
                </p>
              </div>
              <CompareButton id={m.college.id} name={m.college.shortName} />
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-xs">
              {[
                ["Net price", usdCompact(m.netPrice)],
                ["Earnings", usdCompact(m.college.medianEarnings10yr)],
                ["Debt", usdCompact(m.debt)],
                ["ROI", pct(m.roi)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-semibold tabular">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {results.length > limit && (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + 20)}>
            Show {Math.min(20, results.length - limit)} more
          </Button>
        </div>
      )}
    </div>
  );
}

function CompareTray({ ids, onRemove, onClear, href }: { ids: string[]; onRemove: (id: string) => void; onClear: () => void; href: string }) {
  const names = useMemo(() => {
    const all = allCollegeMetrics({ majorId: null, residency: "in-state" });
    return Object.fromEntries(all.map((m) => [m.college.id, m.college.shortName]));
  }, []);
  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="no-print fixed inset-x-0 bottom-4 z-30 px-4"
        >
          <div className="glass mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border-strong p-3 shadow-lift sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="px-1 text-xs font-medium text-muted-foreground tabular">
                {ids.length}/{MAX_COMPARE}
              </span>
              {ids.map((id, i) => (
                <span key={id} className="flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pr-1 pl-2.5 text-xs font-medium">
                  <span className="size-1.5 rounded-full" style={{ background: SERIES[i] }} />
                  {names[id] ?? id}
                  <button type="button" onClick={() => onRemove(id)} aria-label={`Remove ${names[id]}`} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
              <Button size="sm" asChild={ids.length >= 2} disabled={ids.length < 2}>
                {ids.length >= 2 ? (
                  <Link href={href}>
                    Compare {ids.length} <ArrowRight />
                  </Link>
                ) : (
                  <span>Add one more to compare</span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
