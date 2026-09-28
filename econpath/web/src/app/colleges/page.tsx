import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/section";
import { SourceBadge } from "@/components/data/source-badge";
import { CollegeExplorer } from "@/features/colleges/explorer";

export const metadata: Metadata = {
  title: "College ROI Explorer",
  description: "Search, filter and compare 55 colleges by net price, debt, graduation rate, earnings, breakeven and return on investment.",
};

export default function CollegesPage() {
  return (
    <>
      <PageHeader
        eyebrow="College ROI Explorer"
        title="Is this college worth the cost?"
        description="Net price, borrowing and earnings for 55 colleges, weighed against starting work at 18. Filter, sort, and pick up to five to compare side by side."
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Built on
          <SourceBadge sourceId="college-scorecard" label="College Scorecard" />
          <SourceBadge sourceId="ipeds" label="IPEDS" />
          <SourceBadge sourceId="bea-rpp" label="BEA price parities" />
        </div>
      </PageHeader>
      <CollegeExplorer />
    </>
  );
}
