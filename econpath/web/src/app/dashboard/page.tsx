import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dashboard } from "@/features/dashboard/dashboard";

export const metadata: Metadata = {
  title: "Your Economic Future",
  description: "Compare education and career paths with live assumptions: salary, college cost, debt, purchasing power and breakeven.",
};

function DashboardSkeleton() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-10 w-72" />
      <div className="mt-8 grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-6 h-96" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
