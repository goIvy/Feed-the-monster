"use client";

import { ExternalLink, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getSource } from "@/services/catalog";

/** "View source" affordance: publisher, vintage, method and last-updated date for a statistic. */
export function SourceBadge({ sourceId, className, label = "Source" }: { sourceId: string; className?: string; label?: string }) {
  const s = getSource(sourceId);
  if (!s) return null;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium text-subtle-foreground transition hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
          className,
        )}
        aria-label={`View source: ${s.name}`}
      >
        <FileText className="size-3" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Data source</p>
        <p className="mt-1 font-semibold">{s.name}</p>
        <p className="text-xs text-muted-foreground">{s.publisher}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Dataset</dt>
          <dd>{s.dataset}</dd>
          <dt className="text-muted-foreground">Year</dt>
          <dd>{s.vintage}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{new Date(s.lastUpdated + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{s.methodology}</p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Publisher site <ExternalLink className="size-3" />
          </a>
          <a href={`/sources#${s.id}`} className="text-muted-foreground hover:text-foreground">
            All sources
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
