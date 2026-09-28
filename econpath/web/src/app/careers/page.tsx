import type { Metadata } from "next";
import { SourceBadge } from "@/components/data/source-badge";
import { PageHeader } from "@/components/layout/section";
import { PreviewBanner } from "@/components/layout/preview-banner";
import { CareersTable } from "@/features/careers/careers-table";

export const metadata: Metadata = {
  title: "Career Explorer",
  description: "Median wages, pay ranges, projected job growth and typical education for 112 occupations.",
};

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Career Explorer"
        title="What careers pay, and where they're growing."
        description="Wages, pay ranges, projected growth and education requirements for 112 occupations from the Bureau of Labor Statistics."
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Built on <SourceBadge sourceId="bls-oews" label="BLS wages" /> <SourceBadge sourceId="bls-ep" label="BLS projections" />
        </div>
      </PageHeader>
      <div className="container-page space-y-6 py-8">
        <PreviewBanner phase="Phase 3">Career pages with a state-by-state &ldquo;where does this pay best after cost of living&rdquo; map are next.</PreviewBanner>
        <CareersTable />
      </div>
    </>
  );
}
