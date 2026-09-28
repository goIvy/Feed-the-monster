import type { Metadata } from "next";
import { LifePathSimulator } from "@/features/simulator/simulator";

export const metadata: Metadata = {
  title: "Life Path Simulator",
  description: "Model finances from age 18 to 40: salary, taxes, rent, loans, savings and milestones, with live what-if sliders.",
};

export default function SimulatorPage() {
  return <LifePathSimulator />;
}
