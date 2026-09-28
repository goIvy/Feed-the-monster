import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollegeCompare } from "@/features/colleges/compare";

export const metadata: Metadata = {
  title: "Compare colleges",
  description: "Side-by-side college ROI: net price, debt, earnings, breakeven and net lifetime value, with sources.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <Skeleton className="h-10 w-2/3" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
          <Skeleton className="mt-6 h-96" />
        </div>
      }
    >
      <CollegeCompare />
    </Suspense>
  );
}
