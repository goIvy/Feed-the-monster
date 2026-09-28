import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/section";
import { dataSources } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Data sources",
  description: "Every dataset behind EconPath: publisher, vintage, methodology and last update.",
};

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trust & transparency"
        title="Data sources"
        description="The public datasets behind EconPath, what we use each for, and when it was last updated. See the methodology for how they combine."
      />
      <div className="container-page py-10">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-soft">
          This release uses a calibrated seed dataset compiled from these sources and rounded; it is not yet a live feed. Dates below are when each source was last reviewed for the
          seed.{" "}
          <Link href="/methodology#data" className="font-medium text-primary hover:underline">
            More on the data
          </Link>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {dataSources.map((s) => (
            <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-soft target:ring-2 target:ring-primary">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
                  <p className="text-sm text-muted-foreground">{s.publisher}</p>
                </div>
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Visit <ExternalLink className="size-3.5" />
                </a>
              </div>
              <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Dataset</dt>
                <dd>{s.dataset}</dd>
                <dt className="text-muted-foreground">Vintage</dt>
                <dd>{s.vintage}</dd>
                <dt className="text-muted-foreground">Frequency</dt>
                <dd>{s.updateFrequency}</dd>
                <dt className="text-muted-foreground">Used for</dt>
                <dd>{s.usedFor}</dd>
                <dt className="text-muted-foreground">Last reviewed</dt>
                <dd>{new Date(s.lastUpdated + "T00:00:00").toLocaleDateString("en-US", { dateStyle: "medium" })}</dd>
              </dl>
              <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">{s.methodology}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
