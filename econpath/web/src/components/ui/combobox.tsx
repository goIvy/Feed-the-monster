"use client";

import { Command } from "cmdk";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  detail?: string;
  keywords?: string;
}

/** Searchable single-select. Filters locally; results cap at 60 for speed. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  allowClear = false,
  "aria-label": ariaLabel,
  className,
}: {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  "aria-label": string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    const words = q.split(/\s+/);
    return options
      .filter((o) => {
        const hay = `${o.label} ${o.detail ?? ""} ${o.keywords ?? ""}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 60);
  }, [options, query]);

  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o || setQuery(""))}>
      <div className={cn("relative", className)}>
        <PopoverTrigger
          aria-label={ariaLabel}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-left text-sm shadow-soft transition hover:border-border-strong focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none",
            allowClear && selected && "pr-9",
          )}
        >
          <span className={cn("truncate", !selected && "text-subtle-foreground")}>{selected?.label ?? placeholder}</span>
          {!(allowClear && selected) && <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />}
        </PopoverTrigger>
        {allowClear && selected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Clear ${ariaLabel}`}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
        <Command shouldFilter={false} loop>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            className="h-11 w-full border-b border-border bg-transparent px-3.5 text-sm outline-none placeholder:text-subtle-foreground"
          />
          <Command.List className="max-h-72 overflow-y-auto overscroll-contain p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</Command.Empty>
            {filtered.map((o) => (
              <Command.Item
                key={o.value}
                value={o.value}
                onSelect={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.detail && <span className="block truncate text-xs text-muted-foreground">{o.detail}</span>}
                </span>
                {o.value === value && <Check className="size-3.5 text-primary" />}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Multi-select built on Combobox: chips plus an "add" picker. */
export function MultiCombobox({
  options,
  values,
  onChange,
  max = 3,
  placeholder,
  "aria-label": ariaLabel,
}: {
  options: ComboOption[];
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  placeholder: string;
  "aria-label": string;
}) {
  const remaining = options.filter((o) => !values.includes(o.value));
  return (
    <div className="space-y-3">
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((v) => {
            const o = options.find((x) => x.value === v);
            return (
              <li key={v} className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-1.5 pl-3 text-sm shadow-soft">
                {o?.label ?? v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Remove ${o?.label ?? v}`}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {values.length < max && (
        <Combobox
          aria-label={ariaLabel}
          options={remaining}
          value={null}
          onChange={(v) => v && onChange([...values, v])}
          placeholder={values.length ? `Add another (up to ${max})` : placeholder}
        />
      )}
    </div>
  );
}
