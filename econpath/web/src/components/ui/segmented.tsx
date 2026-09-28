"use client";

import { motion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** Pill toggle with a sliding indicator. Arrow keys move between options. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
  "aria-label": ariaLabel,
  layoutId,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "sm" | "default";
  "aria-label": string;
  layoutId: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-1", className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            "relative rounded-full font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=on]:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            size === "sm" ? "h-7 px-3 text-xs" : "h-8 px-3.5 text-[13px]",
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-card shadow-soft ring-1 ring-border"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative z-10 whitespace-nowrap">{o.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
