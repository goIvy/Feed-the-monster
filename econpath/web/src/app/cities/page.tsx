import type { Metadata } from "next";
import { SourceBadge } from "@/components/data/source-badge";
import { PageHeader } from "@/components/layout/section";
import { PreviewBanner } from "@/components/layout/preview-banner";
import { CitiesTable } from "@/features/cities/cities-table";
import { SalaryTranslator } from "@/features/cities/salary-translator";

export const metadata: Metadata = {
  title: "City Affordability Explorer",
  description: "Rent, prices, taxes and purchasing power in 53 U.S. metro areas, plus a salary translator.",
};

export default function CitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="City Affordability Explorer"
        title="How far does a paycheck go?"
        description="Rent, everyday costs, taxes and purchasing power in 53 metro areas. Translate any salary between cities."
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Built on <SourceBadge sourceId="bea-rpp" label="BEA price parities" /> <SourceBadge sourceId="acs" label="Census ACS" /> <SourceBadge sourceId="state-tax" label="State taxes" />
        </div>
      </PageHeader>
      <div className="container-page space-y-8 py-8">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
          <p className="text-[12.5px] font-semibold tracking-wide text-primary">Salary Translator</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Same lifestyle, different city.</h2>
          <div className="mt-6">
            <SalaryTranslator />
          </div>
        </section>
        <PreviewBanner phase="Phase 4">City-vs-city comparisons, lifestyle budgets and the animated affordability map are next.</PreviewBanner>
        <CitiesTable />
      </div>
    </>
  );
}
