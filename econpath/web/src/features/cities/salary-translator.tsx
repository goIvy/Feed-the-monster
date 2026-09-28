"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { cityBudget, equivalentSalary } from "@/lib/engine";
import { usd, usdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCity, stateTaxRate } from "@/services/catalog";
import { cityOptions } from "@/services/options";

const TARGETS = ["austin", "dallas", "new-york", "seattle", "chicago", "raleigh"];

const ctx = (id: string) => {
  const city = getCity(id)!;
  return { city, stateTaxRate: stateTaxRate(city.state) };
};

export function SalaryTranslator() {
  const [salary, setSalary] = useState(120_000);
  const [raw, setRaw] = useState("120,000");
  const [from, setFrom] = useState("san-francisco");
  const results = useMemo(() => {
    const src = ctx(from);
    return TARGETS.filter((t) => t !== from).map((t) => {
      const eq = equivalentSalary(salary, src, ctx(t));
      return { city: getCity(t)!, eq, diff: eq - salary, budget: cityBudget(eq, ctx(t)) };
    });
  }, [salary, from]);
  const maxEq = Math.max(salary, ...results.map((r) => r.eq));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">What salary gives you the same lifestyle, after taxes and local prices?</p>
        <label className="block">
          <span className="text-sm font-medium">Salary</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle-foreground">$</span>
            <Input
              inputMode="numeric"
              className="h-11 pl-7 text-base font-semibold tabular"
              value={raw}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                setRaw(e.target.value);
                if (n > 0 && n < 5_000_000) setSalary(n);
              }}
              onBlur={() => setRaw(salary.toLocaleString("en-US"))}
              aria-label="Salary"
            />
          </div>
        </label>
        <div>
          <span className="text-sm font-medium">In</span>
          <Combobox aria-label="Current city" options={cityOptions} value={from} onChange={(v) => v && setFrom(v)} className="mt-1.5" searchPlaceholder="Search cities" />
        </div>
        <p className="text-xs leading-relaxed text-subtle-foreground">
          Solves for the salary whose take-home pay (federal, state and local tax) buys the same basket at local prices (BEA regional price parities).
        </p>
      </div>
      <ul className="space-y-2.5" aria-live="polite">
        {results.map(({ city, eq, diff }) => (
          <li key={city.id} className="rounded-xl border border-border bg-background-elevated p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{usdCompact(salary)} in {getCity(from)!.name}</span>
                <ArrowRight className="size-3.5 text-subtle-foreground" />
                <span className="font-medium">{city.name}</span>
              </span>
              <span className="text-right">
                <span className="text-lg font-semibold tabular">{usd(eq)}</span>
                <span className={cn("ml-2 text-xs tabular", diff < 0 ? "text-positive" : "text-negative")}>
                  {diff < 0 ? "−" : "+"}
                  {usdCompact(Math.abs(diff))}
                </span>
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1 transition-[width] duration-500" style={{ width: `${((eq / maxEq) * 100).toFixed(2)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
