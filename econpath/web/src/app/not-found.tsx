import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">This path doesn&apos;t lead anywhere.</h1>
        <p className="mt-3 text-muted-foreground">The page may have moved. Try search (⌘K) or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/colleges">Explore colleges</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
