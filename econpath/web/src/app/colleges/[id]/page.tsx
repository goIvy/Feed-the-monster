import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceBadge } from "@/components/data/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCompareButton, CollegeRoiChart } from "@/features/colleges/college-detail-client";
import { collegeMetrics } from "@/features/colleges/metrics";
import { DEFAULT_EDITABLE, encodeState } from "@/features/dashboard/state";
import { simulatePath } from "@/lib/engine";
import { compactNumber, number, pct, usd, usdCompact } from "@/lib/format";
import { buildPathInput, cityForCollege, colleges, getCollege, majors } from "@/services/catalog";

export function generateStaticParams() {
  return colleges.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/colleges/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = getCollege(id);
  if (!c) return { title: "College not found" };
  return {
    title: `${c.shortName}: cost, earnings and ROI`,
    description: `Net price, debt, graduation rate, earnings and return on investment for ${c.name}.`,
  };
}

export default async function CollegePage({ params }: PageProps<"/colleges/[id]">) {
  const { id } = await params;
  const college = getCollege(id);
  if (!college) notFound();

  const city = cityForCollege(college);
  const m = collegeMetrics(college, { majorId: null, residency: "in-state" });
  const outOfState = collegeMetrics(college, { majorId: null, residency: "out-of-state" });

  const byMajor = majors
    .map((major) => ({ major, s: simulatePath(buildPathInput({ collegeId: college.id, majorId: major.id })).summary }))
    .sort((a, b) => b.s.netPresentValue - a.s.netPresentValue);
  const majorRows = [...byMajor.slice(0, 6), ...byMajor.slice(-3)];

  const similar = colleges
    .filter((c) => c.id !== college.id)
    .map((c) => ({
      c,
      d: Math.abs(Math.log(c.medianEarnings10yr / college.medianEarnings10yr)) + Math.abs(Math.log((c.avgNetPrice + 1) / (college.avgNetPrice + 1))) * 0.6 + (c.state === college.state ? -0.15 : 0),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4)
    .map((x) => x.c);

  const dashboardHref = `/dashboard?s=${encodeState({
    version: 1,
    paths: [{ id: "a", collegeId: college.id, majorId: null, occupationId: null, cityId: null, residency: "in-state" }],
    assumptions: DEFAULT_EDITABLE,
  })}`;

  const kpis = [
    { label: "Average net price", value: `${usd(m.netPrice)}/yr`, sub: college.control === "public" ? `${usd(outOfState.netPrice)} out-of-state (est.)` : "After grants and scholarships", source: "college-scorecard" },
    { label: "Median earnings", value: usd(college.medianEarnings10yr), sub: "10 years after entering", source: "college-scorecard" },
    { label: "Debt at graduation", value: usd(m.debt), sub: `${usd(m.monthlyPayment)}/mo over 10 years`, source: "college-scorecard" },
    { label: "Graduation rate", value: pct(college.gradRate), sub: `Retention ${pct(college.retentionRate)}`, source: "college-scorecard" },
    { label: "Breakeven", value: m.breakevenAge ? `Age ${m.breakevenAge}` : "After 40", sub: "vs. working from 18", source: "college-scorecard" },
    { label: "ROI to age 40", value: pct(m.roi), sub: `${usdCompact(m.npv)} present value`, source: "college-scorecard" },
  ];

  const coa = college.costOfAttendance;
  const grant = Math.max(0, coa - college.avgNetPrice);

  return (
    <>
      <div className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="bg-hero absolute inset-0 opacity-70" />
        <div className="container-page relative py-10 sm:py-14">
          <Link href="/colleges" className="text-[12.5px] font-semibold tracking-wide text-primary hover:underline">
            ← College ROI Explorer
          </Link>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{college.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {college.state} · priced against the {city.name} metro
                </span>
                <Badge variant={college.control === "public" ? "default" : "violet"}>{college.control === "public" ? "Public" : "Private nonprofit"}</Badge>
                <Badge variant="muted">{compactNumber(college.undergradSize)} undergraduates</Badge>
                {college.acceptanceRate != null && <Badge variant="muted">{pct(college.acceptanceRate)} admitted</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AddToCompareButton collegeId={college.id} name={college.shortName} />
              <Button asChild>
                <Link href={dashboardHref}>
                  Model this path <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <dt className="flex items-center justify-between gap-1 text-[12.5px] text-muted-foreground">
                {k.label}
                <SourceBadge sourceId={k.source} label="" />
              </dt>
              <dd className="mt-1.5 text-xl font-semibold tracking-tight tabular">{k.value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{k.sub}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <CollegeRoiChart collegeId={college.id} />
          </section>

          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight">What a year costs</h2>
              <SourceBadge sourceId="ipeds" />
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">Sticker price versus what the average aided student pays{college.control === "public" ? " (in-state)" : ""}.</p>
            <div className="mt-5 space-y-4 text-sm">
              {[
                { label: "Cost of attendance", value: coa, color: "var(--chart-muted)", w: 1 },
                { label: "Average grants & scholarships", value: -grant, color: "var(--chart-3)", w: grant / coa },
                { label: "Average net price", value: college.avgNetPrice, color: "var(--chart-1)", w: college.avgNetPrice / coa },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium tabular">{r.value < 0 ? `−${usd(-r.value)}` : usd(r.value)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, r.w * 100).toFixed(2)}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Tuition, in-state</dt>
                <dd className="font-medium tabular">{usd(college.tuitionInState)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tuition, out-of-state</dt>
                <dd className="font-medium tabular">{usd(college.tuitionOutOfState)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Receive grant aid</dt>
                <dd className="font-medium tabular">{pct(college.pctReceivingGrants)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Local price level</dt>
                <dd className="font-medium tabular">{city.rpp.toFixed(1)} (U.S. = 100)</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <h2 className="text-[15px] font-semibold tracking-tight">How majors compare at {college.shortName}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Six highest and three lowest present values to age 40. National major earnings adjusted for this college and metro; not program-level data.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-y border-border bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2.5 pl-5 font-medium sm:pl-6">Major</th>
                  <th scope="col" className="py-2.5 text-right font-medium">Starting salary</th>
                  <th scope="col" className="py-2.5 text-right font-medium">Salary at yr 10</th>
                  <th scope="col" className="py-2.5 text-right font-medium">Breakeven</th>
                  <th scope="col" className="py-2.5 pr-5 text-right font-medium sm:pr-6">Value by 40 (PV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {majorRows.map(({ major, s }, i) => (
                  <tr key={major.id} className={i === 6 ? "border-t-2 border-border-strong" : undefined}>
                    <td className="py-2.5 pl-5 sm:pl-6">
                      {major.name}
                      <span className="ml-2 text-xs text-subtle-foreground">{major.category}</span>
                    </td>
                    <td className="py-2.5 text-right tabular">{usdCompact(s.startingSalaryToday)}</td>
                    <td className="py-2.5 text-right tabular">{usdCompact(s.salaryYear10Today)}</td>
                    <td className="py-2.5 text-right tabular">{s.breakevenAge ? `Age ${s.breakevenAge}` : "40+"}</td>
                    <td className={`py-2.5 pr-5 text-right font-medium tabular sm:pr-6 ${s.netPresentValue < 0 ? "text-negative" : ""}`}>{usdCompact(s.netPresentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-xs text-subtle-foreground sm:px-6">Today&apos;s dollars. Present value uses a 3% real discount rate.</p>
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Similar colleges</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Closest on earnings and net price, favoring the same state.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <Link href={`/colleges/${c.id}`} className="font-semibold hover:text-primary">
                  {c.shortName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {c.state} · {c.control === "public" ? "Public" : "Private"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Net price <span className="font-medium text-foreground tabular">{usdCompact(c.avgNetPrice)}</span> · Earnings{" "}
                  <span className="font-medium text-foreground tabular">{usdCompact(c.medianEarnings10yr)}</span>
                </p>
                <Link href={`/colleges/compare?ids=${college.id},${c.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Compare with {college.shortName} <ArrowUpRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-subtle-foreground">
          Institution-level data for {number(college.undergradSize)} undergraduates. Earnings and debt describe students who received federal aid. Estimates are not guarantees.{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>
        </p>
      </div>
    </>
  );
}
