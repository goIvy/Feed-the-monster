import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, SectionHeading } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { StoriesPreview } from "@/features/home/stories-preview";

export const metadata: Metadata = {
  title: "Research Lab",
  description: "Original research on college ROI, majors and regions, with methods, data and limitations in the open.",
};

const STUDY = [
  { k: "Research question", v: "How does college ROI differ across majors and regions, and how much of the difference remains after accounting for local prices?" },
  { k: "Dataset", v: "College Scorecard field-of-study earnings and debt, BEA regional price parities, BLS metro wages." },
  { k: "Method", v: "OLS of log earnings on major, region and institution characteristics with robust standard errors; purchasing-power-adjusted ROI as a second outcome. Users will toggle covariates and see coefficients update." },
  { k: "What it can't show", v: "Causal effects. Students choose majors and colleges for reasons that also affect earnings; results describe associations." },
];

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Research Lab"
        title="Economics research, in the open."
        description="Each study publishes its question, data, model, results and limitations, and lets you explore the model yourself."
      />
      <div className="container-page space-y-16 py-10">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <FlaskConical className="size-5 text-violet" />
            <h2 className="text-xl font-semibold tracking-tight">Study 1: College ROI across majors and regions</h2>
            <Badge variant="violet">In progress · Phase 8</Badge>
          </div>
          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            {STUDY.map((s) => (
              <div key={s.k}>
                <dt className="text-xs font-semibold tracking-wide text-subtle-foreground uppercase">{s.k}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section id="stories" className="scroll-mt-24">
          <SectionHeading eyebrow="Economic stories" title="Stories in production" description="Headline figures below are computed live from EconPath's current dataset and model." />
          <div className="mt-8">
            <StoriesPreview />
          </div>
        </section>
      </div>
    </>
  );
}
