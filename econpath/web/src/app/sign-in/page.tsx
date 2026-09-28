import { Check, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign in", description: "EconPath accounts are coming soon." };

export default function SignInPage() {
  return (
    <div className="relative">
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-96 opacity-70" />
      <div className="container-page relative grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
          <LogoMark className="mx-auto size-10" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Accounts are on the way</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Soon you&apos;ll be able to save colleges, careers and scenarios into folders and pick up on any device. For now, your dashboard is saved privately in this browser.
          </p>
          <ul className="mt-6 space-y-2 text-left text-sm">
            {["Your dashboard and comparison list persist on this device", "Share any dashboard or comparison with a link", "Export a PDF report for a family or counselor meeting"].map((t) => (
              <li key={t} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-2">
            <Button asChild size="lg">
              <Link href="/dashboard">Go to my dashboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/start">Personalize EconPath</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-subtle-foreground">
            <Lock className="size-3" /> We never sell personal data.
          </p>
        </div>
      </div>
    </div>
  );
}
