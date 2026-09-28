import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cityBudget, simulatePath } from "@/lib/engine";
import { usdCompact } from "@/lib/format";
import { buildPathInput, cities, colleges, stateTaxRate } from "@/services/catalog";

function computeStories() {
  const npvs = colleges.map((c) => simulatePath(buildPathInput({ collegeId: c.id })).summary.netPresentValue);
  const positive = npvs.filter((v) => v > 0).length;

  const leftovers = cities
    .map((c) => ({ city: c, left: cityBudget(60_000, { city: c, stateTaxRate: stateTaxRate(c.state) }).leftover }))
    .sort((a, b) => b.left - a.left);

  const pp = cities
    .map((c) => ({ city: c, value: cityBudget(100_000, { city: c, stateTaxRate: stateTaxRate(c.state) }).purchasingPower }))
    .sort((a, b) => b.value - a.value);

  return { positive, total: colleges.length, leftovers, pp };
}

export function StoriesPreview() {
  const { positive, total, leftovers, pp } = computeStories();
  const best = pp[0];
  const worst = pp[pp.length - 1];
  const maxLeft = leftovers[0].left;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/research#stories" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
        <Badge variant="violet" className="self-start">Story</Badge>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Is College Still Worth It?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          At {positive} of {total} colleges in our dataset, the typical graduate is ahead of a high school graduate by age 40 in present-value terms.
        </p>
        <div className="mt-5 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
          <span className="rounded-l-full bg-chart-1" style={{ width: `${((positive / total) * 100).toFixed(2)}%` }} />
          <span className="flex-1 rounded-r-full bg-muted" />
        </div>
        <p className="mt-2 text-xs text-subtle-foreground tabular">
          {positive} ahead · {total - positive} not yet
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
          Read the analysis <ArrowUpRight className="size-3.5" />
        </span>
      </Link>

      <Link href="/research#stories" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
        <Badge variant="teal" className="self-start">Story</Badge>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Where Can Gen Z Actually Afford to Live?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Monthly money left on a $60,000 salary after taxes, a one-bedroom and everyday costs.</p>
        <ul className="mt-4 space-y-2">
          {[...leftovers.slice(0, 3), leftovers[leftovers.length - 1]].map(({ city, left }, i) => (
            <li key={city.id} className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {i === 3 && <span className="mr-1 text-subtle-foreground">…</span>}
                  {city.name}
                </span>
                <span className="font-medium tabular">{left < 0 ? `−${usdCompact(-left)}` : usdCompact(left)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className={left < 0 ? "h-full rounded-full bg-chart-2" : "h-full rounded-full bg-chart-3"}
                  style={{ width: `${Math.max(4, (Math.abs(left) / maxLeft) * 100).toFixed(2)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
          Read the analysis <ArrowUpRight className="size-3.5" />
        </span>
      </Link>

      <Link href="/research#stories" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
        <Badge variant="amber" className="self-start">Story</Badge>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">What Does $100,000 Actually Feel Like?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          After taxes and local prices, the same salary buys {usdCompact(best.value - worst.value)} more a year in {best.city.name} than in {worst.city.name}.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">{best.city.name}</p>
            <p className="text-lg font-semibold tabular">{usdCompact(best.value)}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">{worst.city.name}</p>
            <p className="text-lg font-semibold tabular">{usdCompact(worst.value)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-subtle-foreground">Take-home pay at national-average prices.</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
          Read the analysis <ArrowUpRight className="size-3.5" />
        </span>
      </Link>
    </div>
  );
}
