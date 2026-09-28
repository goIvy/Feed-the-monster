import type { Metadata } from "next";
import { OnboardingWizard } from "@/features/onboarding/wizard";

export const metadata: Metadata = {
  title: "Personalize",
  description: "Answer a few optional questions and EconPath builds a dashboard for the paths you're considering.",
};

export default function StartPage() {
  return (
    <div className="relative">
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 h-80 opacity-70" />
      <div className="container-page relative py-10 sm:py-16">
        <OnboardingWizard />
      </div>
    </div>
  );
}
