import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Route,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  status?: "live" | "preview" | "soon";
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Colleges", href: "/colleges", description: "ROI, net price and outcomes for 55 colleges", icon: Building2, status: "live" },
  { label: "Majors", href: "/majors", description: "Early and mid-career pay for 51 majors", icon: GraduationCap, status: "preview" },
  { label: "Careers", href: "/careers", description: "Wages, growth and education for 112 careers", icon: Briefcase, status: "preview" },
  { label: "Cities", href: "/cities", description: "Rent, prices and purchasing power in 53 metros", icon: MapPin, status: "preview" },
  { label: "Simulator", href: "/simulator", description: "Model your finances from 18 to 40", icon: Route, status: "live" },
  { label: "Research", href: "/research", description: "Studies, models and economic stories", icon: FlaskConical, status: "soon" },
  { label: "Tools", href: "/tools", description: "Loan, tax and savings calculators", icon: Calculator, status: "soon" },
];

export const EXPLORE_NAV: NavItem[] = [
  { label: "Your dashboard", href: "/dashboard", description: "Your paths, side by side, with live assumptions", icon: LayoutDashboard, status: "live" },
  { label: "Personalize", href: "/start", description: "Answer a few questions to set up your dashboard", icon: BarChart3, status: "live" },
  ...PRIMARY_NAV,
];
