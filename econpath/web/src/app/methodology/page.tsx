import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import {
  COLLEGE_FACTOR_BOUNDS,
  DEFAULT_ASSUMPTIONS,
  ELASTICITY,
  FEDERAL_TAX,
  HIGH_SCHOOL_PROFILE,
  INSTITUTION_MID_RATIO,
  LIVING_BASELINE,
  NATIONAL,
} from "@/lib/engine";
import { pct, usd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How EconPath calculates salaries, college costs, debt, taxes, purchasing power, ROI and breakeven, with every assumption and limitation.",
};

const SECTIONS = [
  { id: "principles", title: "Principles" },
  { id: "data", title: "The data" },
  { id: "salary", title: "Salary estimates" },
  { id: "cost", title: "College cost & debt" },
  { id: "taxes", title: "Taxes" },
  { id: "living", title: "Living costs & purchasing power" },
  { id: "roi", title: "ROI, breakeven & net value" },
  { id: "inflation", title: "Inflation & other defaults" },
  { id: "limitations", title: "Limitations & uncertainty" },
  { id: "roadmap", title: "Roadmap" },
];

const ROADMAP: { phase: string; title: string; status: "live" | "preview" | "planned" }[] = [
  { phase: "1", title: "Design system, homepage, navigation, dashboard", status: "live" },
  { phase: "2", title: "College ROI Explorer and comparison reports", status: "live" },
  { phase: "3", title: "Major and career explorers", status: "preview" },
  { phase: "4", title: "City affordability explorer and salary translator", status: "preview" },
  { phase: "5", title: "Life Path Simulator", status: "preview" },
  { phase: "6", title: "Maps and advanced visualizations", status: "preview" },
  { phase: "7", title: "Accounts, saved scenarios and folders", status: "planned" },
  { phase: "8", title: "Research lab and economic stories", status: "planned" },
  { phase: "9", title: "Ask EconPath (AI explanations grounded in this data)", status: "planned" },
  { phase: "10", title: "Counselor mode and shareable reports", status: "preview" },
];

function Formula({ children }: { children: React.ReactNode }) {
  return <pre className="my-4 overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground">{children}</pre>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 border-t border-border pt-10 text-2xl font-semibold tracking-tight first:border-t-0 first:pt-0">
      {children}
    </h2>
  );
}

export default function MethodologyPage() {
  const a = DEFAULT_ASSUMPTIONS;
  return (
    <>
      <PageHeader
        eyebrow="Trust & transparency"
        title="Methodology"
        description="How every number on EconPath is produced, which assumptions sit behind it, and where it can be wrong. Estimates are projections, never guarantees."
      />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-6 text-[15px] leading-relaxed text-muted-foreground [&_strong]:text-foreground">
          <H2 id="principles">Principles</H2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Show tradeoffs, not advice.</strong> EconPath never ranks a choice as right for you. It shows what public data and a stated model imply.
            </li>
            <li>
              <strong>Every assumption is visible and editable.</strong> Defaults are listed below; the dashboard lets you change them.
            </li>
            <li>
              <strong>Correlation is not causation.</strong> Graduates of some colleges earn more partly because of who enrolls. We dampen those gaps rather than treat them as the college&apos;s effect.
            </li>
            <li>
              <strong>One engine.</strong> The homepage, dashboard, explorer and reports all call the same tested calculation engine, mirrored in the Python API.
            </li>
          </ul>

          <H2 id="data">The data</H2>
          <p>
            This release ships with a <strong>calibrated seed dataset</strong>: 55 colleges, 51 majors, 112 occupations, 53 metro areas and all 50 states plus DC. Values were compiled
            from the published ranges of the sources listed on the{" "}
            <Link href="/sources" className="font-medium text-primary hover:underline">
              data sources
            </Link>{" "}
            page and rounded. They are realistic but may differ from the latest official release for a given institution or place, and some fields (such as the automation exposure index)
            are EconPath estimates. Each table has a schema contract; the ingestion pipeline validates types, ranges and cross-references, so live releases can replace the seed file for file.
          </p>

          <H2 id="salary">Salary estimates</H2>
          <p>Each path gets a starting salary and a mid-career salary (year 15), in today&apos;s dollars, from the most specific source available:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>A chosen career:</strong> start = 10th percentile + 35% of the way to the median; mid-career = median + 35% of the way to the 90th percentile (BLS OEWS).
            </li>
            <li>
              <strong>A chosen major:</strong> the major&apos;s early-career (ages 22–27) and mid-career (35–45) medians (New York Fed).
            </li>
            <li>
              <strong>Neither:</strong> the college&apos;s own median earnings ten years after entry (College Scorecard), treated as year 6 of work, with mid-career at {INSTITUTION_MID_RATIO}× the start.
            </li>
          </ol>
          <p>Career and major profiles are then scaled by two attenuated factors:</p>
          <Formula>
            {`college factor = clamp( (college median earnings / ${usd(NATIONAL.collegeMedianEarnings10yr)}) ^ ${ELASTICITY.college}, ${COLLEGE_FACTOR_BOUNDS.min}, ${COLLEGE_FACTOR_BOUNDS.max} )
city factor    = (metro mean wage / ${usd(NATIONAL.meanWage)}) ^ ${ELASTICITY.cityWage}`}
          </Formula>
          <p>
            The exponents below 1 reflect that much of the raw gap between colleges or cities reflects who attends or moves there. Salary then follows a concave curve toward mid-career:
          </p>
          <Formula>{`salary(t) = start + (mid − start) × (1 − e^(−t/6)) / (1 − e^(−15/6))     for years 0–15
salary(t) = mid × 1.005^(t − 15)                                     after year 15`}</Formula>

          <H2 id="cost">College cost &amp; debt</H2>
          <p>
            Annual cost is the college&apos;s <strong>average net price</strong> after grants. Out-of-state students at public colleges add {pct(0.9)} of the tuition difference. Prices grow{" "}
            {pct(a.tuitionInflation)} a year while enrolled. If you enter your own grant aid, net price becomes cost of attendance minus that aid.
          </p>
          <p>
            Borrowing defaults to the college&apos;s <strong>typical share</strong>: median federal debt ÷ (4 × net price), capped at 90%. You can instead set a family contribution or a
            total loan amount. Loans accrue interest at {pct(a.loanRate, 2)} while enrolled and are repaid on a standard {a.loanTermYears}-year plan:
          </p>
          <Formula>{`monthly payment = P × r / (1 − (1 + r)^−n)      r = rate / 12, n = 120`}</Formula>

          <H2 id="taxes">Taxes</H2>
          <p>
            Federal income tax uses 2025 single-filer brackets with a {usd(FEDERAL_TAX.standardDeduction)} standard deduction; brackets are indexed to inflation in projections. FICA is 7.65%
            up to the Social Security wage base plus the 0.9% additional Medicare tax. State tax applies a simplified effective rate above a $5,000 deduction; local income taxes (for example
            New York City and Philadelphia) are added where they apply. A {pct(a.retirementRate)} pre-tax retirement contribution lowers taxable income.
          </p>

          <H2 id="living">Living costs &amp; purchasing power</H2>
          <p>
            Rent is the metro&apos;s median one-bedroom (you can split it with a roommate). Everyday costs start from a national baseline for a single adult (groceries {usd(LIVING_BASELINE.groceries)}, utilities{" "}
            {usd(LIVING_BASELINE.utilities)}, healthcare {usd(LIVING_BASELINE.healthcare)}, personal {usd(LIVING_BASELINE.personal)} a month), scaled by half of the metro&apos;s price gap, plus local
            transportation costs.
          </p>
          <Formula>{`purchasing power = take-home pay / (regional price parity / 100)
monthly disposable = take-home − rent − everyday costs − loan payment`}</Formula>
          <p>
            The salary translator solves for the salary in another city with the same purchasing power after federal, state and local taxes.
          </p>

          <H2 id="roi">ROI, breakeven &amp; net value</H2>
          <p>
            Every path is compared with a <strong>counterfactual</strong>: starting full-time work at 18 with a high school diploma in the same metro ({usd(HIGH_SCHOOL_PROFILE.start)} rising
            to {usd(HIGH_SCHOOL_PROFILE.mid)} in today&apos;s dollars).
          </p>
          <Formula>{`net gain(year) = degree earnings − net price paid − loan interest − high-school earnings
breakeven      = first age at which cumulative net gain ≥ 0
NPV (to 40)    = Σ net gain(year) / (1 + d)^year     d = (1 + ${pct(a.discountRate)} real)(1 + inflation) − 1
ROI (to 40)    = NPV / present value of (net price + forgone earnings while enrolled)`}</Formula>
          <p>
            Horizons stop at age {a.horizonAge}, which understates lifetime returns for careers with steep late growth. Earnings are pre-tax in ROI and after-tax in budgets.
          </p>

          <H2 id="inflation">Inflation &amp; other defaults</H2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {[
                  ["Inflation (prices, rent, wages)", pct(a.inflation, 1)],
                  ["College price growth", pct(a.tuitionInflation)],
                  ["Federal loan rate (2025–26 undergraduate)", pct(a.loanRate, 2)],
                  ["Real discount rate", pct(a.discountRate)],
                  ["Savings rate (share of take-home)", pct(a.savingsRate)],
                  ["Retirement contribution (pre-tax)", pct(a.retirementRate)],
                  ["Investment return (nominal)", pct(a.investmentReturn)],
                  ["Years of college", String(a.yearsInSchool)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2.5">{k}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground tabular">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="limitations">Limitations &amp; uncertainty</H2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Medians describe typical outcomes. Individual results vary widely; a quarter of graduates of any major earn below its 25th percentile.</li>
            <li>College earnings describe federally aided students and are institution-wide, not by program, in this release.</li>
            <li>Selection effects: differences between colleges are partly about who enrolls. Nothing here shows a college causes higher earnings.</li>
            <li>Taxes are simplified (single filer, standard deduction, effective state rates). Credits, itemizing and filing status are not modeled.</li>
            <li>Net price is an average; your aid depends on your family&apos;s finances. Use your college&apos;s net price calculator for a personal estimate.</li>
            <li>Six-year graduation rates are shown but the model assumes on-time completion; not finishing is a real financial risk.</li>
            <li>Projections are deterministic. Ranges and scenario bands are on the roadmap.</li>
          </ul>

          <H2 id="roadmap">Roadmap</H2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {ROADMAP.map((r) => (
              <li key={r.phase} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="mr-2 text-subtle-foreground tabular">Phase {r.phase}</span>
                  <span className="text-foreground">{r.title}</span>
                </span>
                <Badge variant={r.status === "live" ? "emerald" : r.status === "preview" ? "teal" : "muted"}>{r.status === "live" ? "Live" : r.status === "preview" ? "Preview" : "Planned"}</Badge>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}
