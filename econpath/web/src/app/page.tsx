import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Audiences } from "@/features/home/audiences";
import { CareerPreview } from "@/features/home/career-preview";
import { CollegePreview } from "@/features/home/college-preview";
import { Credibility } from "@/features/home/credibility";
import { HeroDemo } from "@/features/home/hero-demo";
import { LifePaths } from "@/features/home/life-paths";
import { OpportunityMap } from "@/features/home/opportunity-map";
import { Questions } from "@/features/home/questions";
import { ScenarioPreview } from "@/features/home/scenario-preview";
import { StoriesPreview } from "@/features/home/stories-preview";
import { getUsShapes } from "@/lib/geo";
import { colleges, majors, occupations, cities } from "@/services/catalog";

export default function HomePage() {
  const shapes = getUsShapes();
  const counts = [
    { n: colleges.length, label: "colleges" },
    { n: majors.length, label: "majors" },
    { n: occupations.length, label: "careers" },
    { n: cities.length, label: "metro areas" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 overflow-hidden pt-16">
        <div aria-hidden className="bg-hero absolute inset-0" />
        <div aria-hidden className="bg-grid mask-fade-b absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="container-page relative grid items-center gap-12 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-24 lg:pb-24">
          <div className="animate-fade-up">
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1 pr-3 pl-1 text-xs text-muted-foreground shadow-soft backdrop-blur transition hover:border-border-strong hover:text-foreground"
            >
              <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">New</span>
              Transparent ROI for {colleges.length} colleges
              <ArrowRight className="size-3" />
            </Link>
            <h1 className="mt-6 text-[42px] leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-[68px]">
              Understand the economics behind{" "}
              <span className="font-serif font-normal tracking-[-0.01em] italic text-gradient">your future.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Compare colleges, careers, salaries, living costs, debt, and long-term financial outcomes using real economic data.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/start">
                  Explore your future <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">
                  <PlayCircle /> See how it works
                </Link>
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {counts.map((c) => (
                <div key={c.label} className="flex items-baseline gap-1.5">
                  <dt className="sr-only">{c.label}</dt>
                  <dd className="text-2xl font-semibold tracking-tight tabular">{c.n}</dd>
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* Branching life paths */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-card">
        <div className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow="One decision, many paths"
            title="See where each path leads, year by year."
            description="Five real paths through EconPath's model, from the first day of college to age 40. Every line accounts for net price, borrowing, taxes, rent and living costs in the city where you'd work."
          />
          <div className="mt-10">
            <LifePaths />
          </div>
          <p className="mt-6 text-xs text-subtle-foreground">
            Net worth = savings and retirement balances minus student debt, in future dollars. Assumes 10% savings, a 5% retirement contribution and 6% returns.
          </p>
        </div>
      </section>

      {/* Questions */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Questions EconPath can answer"
          title="Big decisions, broken into questions you can check."
          description="Start from the question you actually have. Each one opens a tool with the data, the math and the assumptions in plain view."
        />
        <div className="mt-10">
          <Questions />
        </div>
      </section>

      {/* College comparison */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="College ROI Explorer"
          title="Is a more expensive college worth it?"
          description="UCLA, UC Berkeley and USC through the same lens: what families actually pay, what graduates typically earn, and when the investment pays back."
          action={
            <Button variant="outline" asChild>
              <Link href="/colleges">
                Explore all colleges <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="mt-10">
          <CollegePreview />
        </div>
      </section>

      {/* Opportunity map */}
      <section id="opportunity-map" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Economic opportunity map"
            title="Opportunity looks different in every state."
            description="Switch layers to compare income, rent, unemployment, job growth and what a paycheck really buys. Select a state for its full profile."
          />
          <div className="mt-10 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-8">
            <OpportunityMap shapes={shapes} />
          </div>
        </div>
      </section>

      {/* Careers */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Career Explorer"
          title="Pay and growth for 112 careers, side by side."
          description="Median wages from the Bureau of Labor Statistics plotted against projected job growth through 2034. Filter by field, hover for details."
          action={
            <Button variant="outline" asChild>
              <Link href="/careers">
                Browse careers <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="mt-10">
          <CareerPreview />
        </div>
      </section>

      {/* Scenario */}
      <section className="border-y border-border bg-card/60">
        <div className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow="Scenario simulator"
            title="What if rent rises, or your first salary is lower?"
            description="Drag a slider and the whole projection recalculates. The dashed line is the baseline; the solid line is your scenario."
            action={
              <Button asChild>
                <Link href="/dashboard">
                  Open the full simulator <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-10">
            <ScenarioPreview />
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          eyebrow="Economic stories"
          title="The data behind the headlines."
          description="Interactive articles built on the same public data and model. Each one ships with its methodology and downloadable data."
        />
        <div className="mt-10">
          <StoriesPreview />
        </div>
      </section>

      {/* Credibility */}
      <section className="border-y border-border bg-card">
        <div className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow="Built on public data"
            title="Transparent by design."
            description="EconPath is built to be inspected. Sources, vintages, formulas and limitations are documented, and every assumption can be changed."
          />
          <div className="mt-10">
            <Credibility />
          </div>
        </div>
      </section>

      {/* Audiences / testimonials placeholder */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading eyebrow="Who it's for" title="Made for the people making the decision." align="center" />
        <div className="mt-10">
          <Audiences />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0b1324] px-6 py-14 text-white sm:px-14 sm:py-20 dark:border dark:border-border dark:bg-card">
          <div
            aria-hidden
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(50% 80% at 10% 0%, rgba(59,99,240,0.45), transparent 70%), radial-gradient(40% 70% at 100% 100%, rgba(106,75,214,0.4), transparent 70%)",
            }}
          />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Start with your own path. <span className="font-serif font-normal italic">It takes two minutes.</span>
            </h2>
            <p className="mt-5 text-lg text-white/70">
              Tell us what you&apos;re considering. We&apos;ll build a dashboard you can adjust, compare and share.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="bg-white text-[#0b1324] hover:bg-white/90">
                <Link href="/start">
                  Explore your future <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-white/80 hover:bg-white/10 hover:text-white">
                <Link href="/colleges">Browse colleges first</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
