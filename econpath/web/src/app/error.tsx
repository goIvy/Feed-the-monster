"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong.</h1>
        <p className="mt-2 text-muted-foreground">The calculation couldn&apos;t finish. Your saved dashboard is unaffected.</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
