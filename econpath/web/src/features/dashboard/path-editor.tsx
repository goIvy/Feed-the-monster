"use client";

import { Trash2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import type { Residency } from "@/lib/engine";
import { getCollege } from "@/services/catalog";
import { careerOptions, cityOptions, collegeOptions, majorOptions } from "@/services/options";
import { pathLabel, type PathConfig } from "./state";

export function PathEditor({
  path,
  color,
  index,
  onChange,
  onRemove,
}: {
  path: PathConfig;
  color: string;
  index: number;
  onChange: (p: PathConfig) => void;
  onRemove?: () => void;
}) {
  const college = getCollege(path.collegeId);
  const { title } = pathLabel(path);
  const letter = String.fromCharCode(65 + index);
  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 shadow-soft">
      <span aria-hidden className="absolute inset-y-4 left-0 w-[3px] rounded-r-full" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Path {letter}</p>
          <p className="truncate text-sm font-semibold">{title}</p>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove path ${letter}`} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-negative">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-2 pl-1">
        <Combobox aria-label={`College for path ${letter}`} options={collegeOptions} value={path.collegeId} onChange={(v) => v && onChange({ ...path, collegeId: v })} searchPlaceholder="Search colleges" />
        <Combobox aria-label={`Major for path ${letter}`} options={majorOptions} value={path.majorId} onChange={(v) => onChange({ ...path, majorId: v })} placeholder="Any major (college median)" allowClear searchPlaceholder="Search majors" />
        <Combobox aria-label={`Career for path ${letter}`} options={careerOptions} value={path.occupationId} onChange={(v) => onChange({ ...path, occupationId: v })} placeholder="Career (optional)" allowClear searchPlaceholder="Search careers" />
        <Combobox aria-label={`City for path ${letter}`} options={cityOptions} value={path.cityId} onChange={(v) => onChange({ ...path, cityId: v })} placeholder={college ? "Same metro as college" : "City"} allowClear searchPlaceholder="Search cities" />
        {college?.control === "public" && (
          <Segmented<Residency>
            aria-label={`Residency for path ${letter}`}
            layoutId={`res-${path.id}`}
            size="sm"
            className="w-full [&>*]:flex-1"
            value={path.residency}
            onChange={(v) => onChange({ ...path, residency: v })}
            options={[
              { value: "in-state", label: "In-state" },
              { value: "out-of-state", label: "Out-of-state" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
