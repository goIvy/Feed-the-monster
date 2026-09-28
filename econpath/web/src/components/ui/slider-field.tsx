"use client";

import { Info } from "lucide-react";
import { useId } from "react";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  help,
  changed,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  help?: string;
  changed?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <span id={id}>{label}</span>
          {help && (
            <Tooltip content={help}>
              <button type="button" aria-label={`About ${label}`} className="rounded-full text-subtle-foreground hover:text-foreground">
                <Info className="size-3" />
              </button>
            </Tooltip>
          )}
        </span>
        <span className={cn("rounded-md px-1.5 py-0.5 font-medium tabular transition-colors", changed && "bg-accent text-accent-foreground")}>{format(value)}</span>
      </div>
      <Slider aria-labelledby={id} aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="mt-1" />
    </div>
  );
}
