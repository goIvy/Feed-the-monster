import type { Metadata } from "next";
import { SourceBadge } from "@/components/data/source-badge";
import { PageHeader } from "@/components/layout/section";
import { PreviewBanner } from "@/components/layout/preview-banner";
import { MajorsTable } from "@/features/majors/majors-table";

export const metadata: Metadata = {
  title: "Major Explorer",
  description: "Early and mid-career earnings, unemployment, underemployment and job growth for 51 college majors.",
};

export default function MajorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Major Explorer"
        title="Which majors pay off, and how?"
        description="Early and mid-career earnings, unemployment and underemployment for 51 majors. Sort any column; search or filter by field."
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Built on <SourceBadge sourceId="ny-fed-grads" label="New York Fed" /> <SourceBadge sourceId="bls-ep" label="BLS projections" />
        </div>
      </PageHeader>
      <div className="container-page space-y-6 py-8">
        <PreviewBanner phase="Phase 3">Salary growth curves, earnings distributions and side-by-side major comparisons are next.</PreviewBanner>
        <MajorsTable />
      </div>
    </>
  );
}
