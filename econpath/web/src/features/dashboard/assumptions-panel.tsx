"use client";

import { RotateCcw } from "lucide-react";
import { SliderField } from "@/components/ui/slider-field";
import { Switch } from "@/components/ui/switch";
import { signedPct, usd } from "@/lib/format";
import { DEFAULT_EDITABLE, type EditableAssumptions } from "./state";

export type Factor = "tuition" | "aid" | "salary" | "rent" | "inflation" | "loans";
export const FACTORS: Factor[] = ["tuition", "aid", "salary", "rent", "inflation", "loans"];

const GRAD_SCHOOL = { years: 2, annualCost: 32_000, salaryPremium: 0.18 };

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-[13px] text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="mt-0.5" />
    </label>
  );
}

export function AssumptionsPanel({
  value,
  onChange,
  onTouch,
}: {
  value: EditableAssumptions;
  onChange: (next: EditableAssumptions) => void;
  onTouch: (f: Factor) => void;
}) {
  const set = <K extends keyof EditableAssumptions>(key: K, v: EditableAssumptions[K], factor: Factor) => {
    onTouch(factor);
    onChange({ ...value, [key]: v });
  };
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_EDITABLE);
  const pctFmt = (v: number) => signedPct(v * 100, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Assumptions</h2>
        <button
          type="button"
          disabled={isDefault}
          onClick={() => onChange(DEFAULT_EDITABLE)}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="size-3" /> Reset
        </button>
      </div>

      <Group title="College">
        <SliderField
          label="Tuition change"
          help="Raises or lowers the net price at every college in your comparison."
          value={value.tuitionChange}
          min={-0.3}
          max={0.5}
          step={0.05}
          format={pctFmt}
          changed={value.tuitionChange !== 0}
          onChange={(v) => set("tuitionChange", v, "tuition")}
        />
        <SliderField
          label="Extra scholarship / year"
          help="Grants or scholarships beyond the college's typical aid package."
          value={value.scholarshipPerYear}
          min={0}
          max={30000}
          step={500}
          format={usd}
          changed={value.scholarshipPerYear !== 0}
          onChange={(v) => set("scholarshipPerYear", v, "aid")}
        />
        <ToggleRow
          label="Set our family contribution"
          hint={value.familyContributionPerYear == null ? "Off: borrow the college's typical share" : "Borrow whatever is left each year"}
          checked={value.familyContributionPerYear != null}
          onChange={(on) => set("familyContributionPerYear", on ? 10000 : null, "aid")}
        />
        {value.familyContributionPerYear != null && (
          <SliderField
            label="Family contribution / year"
            value={value.familyContributionPerYear}
            min={0}
            max={80000}
            step={1000}
            format={usd}
            changed
            onChange={(v) => set("familyContributionPerYear", v, "aid")}
          />
        )}
      </Group>

      <Group title="Career">
        <SliderField
          label="Starting salary"
          help="Shifts the whole earnings path up or down, e.g. for a slower job search."
          value={value.salaryChange}
          min={-0.3}
          max={0.3}
          step={0.01}
          format={pctFmt}
          changed={value.salaryChange !== 0}
          onChange={(v) => set("salaryChange", v, "salary")}
        />
        <ToggleRow
          label="Add a two-year master's"
          hint={`$${GRAD_SCHOOL.annualCost / 1000}K/yr, fully borrowed; +${GRAD_SCHOOL.salaryPremium * 100}% pay after`}
          checked={value.gradSchool != null}
          onChange={(on) => set("gradSchool", on ? GRAD_SCHOOL : null, "salary")}
        />
      </Group>

      <Group title="Living">
        <SliderField
          label="Rent change"
          value={value.rentChange}
          min={-0.3}
          max={0.5}
          step={0.05}
          format={pctFmt}
          changed={value.rentChange !== 0}
          onChange={(v) => set("rentChange", v, "rent")}
        />
        <ToggleRow
          label="Share an apartment"
          hint="Pay 65% of a one-bedroom's rent"
          checked={value.housingShare < 1}
          onChange={(on) => set("housingShare", on ? 0.65 : 1, "rent")}
        />
        <SliderField
          label="Years living with family"
          help="Right after graduation: no rent, and 60% of everyday costs."
          value={value.livingWithFamilyYears}
          min={0}
          max={4}
          step={1}
          format={(v) => (v === 0 ? "None" : `${v} yr${v > 1 ? "s" : ""}`)}
          changed={value.livingWithFamilyYears !== 0}
          onChange={(v) => set("livingWithFamilyYears", v, "rent")}
        />
      </Group>

      <Group title="Economy">
        <SliderField
          label="Inflation"
          help="Applied to prices, rent and wages. Brackets are indexed, so inflation alone doesn't raise tax rates."
          value={value.inflation}
          min={0.01}
          max={0.06}
          step={0.0025}
          format={(v) => `${(v * 100).toFixed(2).replace(/0$/, "")}%`}
          changed={value.inflation !== DEFAULT_EDITABLE.inflation}
          onChange={(v) => set("inflation", v, "inflation")}
        />
        <SliderField
          label="Loan interest rate"
          help="Default is the 2025–26 federal undergraduate rate of 6.39%."
          value={value.loanRate}
          min={0.03}
          max={0.1}
          step={0.0025}
          format={(v) => `${(v * 100).toFixed(2)}%`}
          changed={value.loanRate !== DEFAULT_EDITABLE.loanRate}
          onChange={(v) => set("loanRate", v, "loans")}
        />
        <SliderField
          label="Tax change"
          help="Percentage points added to (or removed from) your total tax rate."
          value={value.taxChange}
          min={-0.05}
          max={0.05}
          step={0.005}
          format={(v) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`}
          changed={value.taxChange !== 0}
          onChange={(v) => set("taxChange", v, "inflation")}
        />
      </Group>
    </div>
  );
}
