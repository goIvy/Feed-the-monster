import { Sparkles } from "lucide-react";
import Link from "next/link";

/** Explains that a page shows the underlying data while the full interactive explorer is being built. */
export function PreviewBanner({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-teal/25 bg-teal-soft px-4 py-3 text-sm text-teal sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Data preview.</span> {children}
        </span>
      </span>
      <span className="shrink-0 text-xs opacity-80">
        Full explorer: {phase} ·{" "}
        <Link href="/methodology#roadmap" className="underline underline-offset-2">
          roadmap
        </Link>
      </span>
    </div>
  );
}
