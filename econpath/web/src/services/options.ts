import type { ComboOption } from "@/components/ui/combobox";
import { cities, colleges, majors, occupations } from "@/services/catalog";

export const collegeOptions: ComboOption[] = colleges
  .map((c) => ({
    value: c.id,
    label: c.shortName === c.name ? c.name : `${c.shortName}`,
    detail: `${c.name === c.shortName ? "" : `${c.name} · `}${c.state}`,
    keywords: c.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const majorOptions: ComboOption[] = majors
  .map((m) => ({ value: m.id, label: m.name, detail: m.category }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const careerOptions: ComboOption[] = occupations
  .map((o) => ({ value: o.id, label: o.title, detail: o.category }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const cityOptions: ComboOption[] = cities
  .map((c) => ({ value: c.id, label: `${c.name}, ${c.state}`, detail: c.region }))
  .sort((a, b) => a.label.localeCompare(b.label));
