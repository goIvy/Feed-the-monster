import type { Assumptions, Residency } from "@/lib/engine";
import { getCity, getCollege, getMajor, getOccupation } from "@/services/catalog";

export interface PathConfig {
  id: string;
  collegeId: string;
  majorId: string | null;
  occupationId: string | null;
  cityId: string | null;
  residency: Residency;
}

/** The subset of Assumptions a user can edit from the dashboard. */
export type EditableAssumptions = Pick<
  Assumptions,
  | "tuitionChange"
  | "scholarshipPerYear"
  | "familyContributionPerYear"
  | "borrowingTotal"
  | "grantAidOverride"
  | "salaryChange"
  | "rentChange"
  | "housingShare"
  | "livingWithFamilyYears"
  | "inflation"
  | "loanRate"
  | "taxChange"
  | "gradSchool"
>;

export interface DashboardState {
  version: 1;
  paths: PathConfig[];
  assumptions: EditableAssumptions;
}

export type Stage = "high-school" | "college" | "recent-grad" | "parent" | "counselor";

export interface Profile {
  version: 1;
  completed: boolean;
  interests: string[];
  stage: Stage | null;
  careers: string[];
  majors: string[];
  colleges: string[];
  homeCityId: string | null;
  targetCities: string[];
  finances: {
    householdIncome: number | null;
    grantAid: number | null;
    loans: number | null;
    savingsContribution: number | null;
    scholarship: number | null;
  };
}

export const DEFAULT_EDITABLE: EditableAssumptions = {
  tuitionChange: 0,
  scholarshipPerYear: 0,
  familyContributionPerYear: null,
  borrowingTotal: null,
  grantAidOverride: null,
  salaryChange: 0,
  rentChange: 0,
  housingShare: 1,
  livingWithFamilyYears: 0,
  inflation: 0.025,
  loanRate: 0.0639,
  taxChange: 0,
  gradSchool: null,
};

export const DEFAULT_DASHBOARD: DashboardState = {
  version: 1,
  paths: [
    { id: "a", collegeId: "ucla", majorId: "economics", occupationId: "financial-analyst", cityId: "los-angeles", residency: "in-state" },
  ],
  assumptions: DEFAULT_EDITABLE,
};

export const EMPTY_PROFILE: Profile = {
  version: 1,
  completed: false,
  interests: [],
  stage: null,
  careers: [],
  majors: [],
  colleges: [],
  homeCityId: null,
  targetCities: [],
  finances: { householdIncome: null, grantAid: null, loans: null, savingsContribution: null, scholarship: null },
};

export const DASHBOARD_KEY = "econpath:dashboard:v1";
export const PROFILE_KEY = "econpath:profile:v1";
export const MAX_PATHS = 3;

export function pathLabel(p: PathConfig): { title: string; subtitle: string } {
  const college = getCollege(p.collegeId);
  const major = p.majorId ? getMajor(p.majorId) : null;
  const occ = p.occupationId ? getOccupation(p.occupationId) : null;
  const city = p.cityId ? getCity(p.cityId) : college ? getCity(college.cityId) : null;
  return {
    title: `${major?.name ?? "Any major"} · ${college?.shortName ?? "College"}`,
    subtitle: [occ?.title, city ? city.name : null].filter(Boolean).join(" in "),
  };
}

const newId = () => Math.random().toString(36).slice(2, 8);

/** Paths implied by onboarding answers: the first choice of each, then alternates. */
export function pathsFromProfile(profile: Profile): PathConfig[] {
  const colleges = profile.colleges.length ? profile.colleges : ["ucla"];
  const n = Math.min(MAX_PATHS, Math.max(colleges.length, profile.majors.length, profile.targetCities.length, 1));
  const home = profile.homeCityId ? getCity(profile.homeCityId) : null;
  const pick = <T,>(list: T[], i: number): T | null => (list.length ? list[Math.min(i, list.length - 1)] : null);
  return Array.from({ length: n }, (_, i) => {
    const collegeId = pick(colleges, i)!;
    const college = getCollege(collegeId);
    const residency: Residency = home && college && college.control === "public" && home.state !== college.state ? "out-of-state" : "in-state";
    return {
      id: i === 0 ? "a" : newId(),
      collegeId,
      majorId: pick(profile.majors, i),
      occupationId: pick(profile.careers, i),
      cityId: pick(profile.targetCities, i),
      residency,
    };
  });
}

export function assumptionsFromProfile(profile: Profile): EditableAssumptions {
  const f = profile.finances;
  return {
    ...DEFAULT_EDITABLE,
    scholarshipPerYear: f.scholarship ?? 0,
    familyContributionPerYear: f.savingsContribution,
    borrowingTotal: f.loans,
    grantAidOverride: f.grantAid,
  };
}

export function newPath(from?: PathConfig): PathConfig {
  return {
    id: newId(),
    collegeId: from?.collegeId === "nyu" ? "ucla" : "nyu",
    majorId: from?.majorId === "finance" ? "economics" : "finance",
    occupationId: null,
    cityId: "new-york",
    residency: "in-state",
  };
}

/** URL-safe encoding so any dashboard can be shared as a link. */
export function encodeState(state: DashboardState): string {
  const json = JSON.stringify(state);
  const b64 = typeof window === "undefined" ? Buffer.from(json, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(encoded: string): DashboardState | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window === "undefined" ? Buffer.from(b64, "base64").toString("utf8") : decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json) as DashboardState;
    if (parsed.version !== 1 || !Array.isArray(parsed.paths)) return null;
    const paths = parsed.paths.filter((p) => getCollege(p.collegeId)).slice(0, MAX_PATHS);
    if (!paths.length) return null;
    return { version: 1, paths, assumptions: { ...DEFAULT_EDITABLE, ...parsed.assumptions } };
  } catch {
    return null;
  }
}
