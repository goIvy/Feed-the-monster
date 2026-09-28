"use client";

import { cn } from "@/lib/utils";

/** Wrapping row of single-select filter chips. */
export function ChipGroup<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  "aria-label": string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 shrink-0 rounded-full border px-3 text-xs font-medium transition",
            value === o.value
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
