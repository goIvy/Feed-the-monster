import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { dataSources } from "@/services/catalog";

const PRINCIPLES = [
  { title: "Every number has a source", body: "Hover or tap any statistic to see its publisher, vintage and method." },
  { title: "Assumptions you can change", body: "Inflation, interest, rent, taxes and salary are inputs, not hidden constants." },
  { title: "Tradeoffs, not advice", body: "We show what the data implies and where it is uncertain. The decision is yours." },
];

export function Credibility() {
  const featured = dataSources.slice(0, 10);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div>
        <ul className="space-y-5">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald" />
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/methodology" className="font-medium text-primary hover:underline">
            Methodology
          </Link>
          <Link href="/sources" className="font-medium text-primary hover:underline">
            All data sources
          </Link>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {featured.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
            <p className="text-sm font-medium">{s.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.publisher} · {s.vintage}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
