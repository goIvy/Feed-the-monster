import { cities, colleges, majors, occupations } from "@/services/catalog";

export type SearchKind = "college" | "major" | "career" | "city" | "page" | "story";

export interface SearchEntry {
  kind: SearchKind;
  id: string;
  label: string;
  detail: string;
  href: string;
  keywords: string;
}

export const PAGES: SearchEntry[] = [
  { kind: "page", id: "dashboard", label: "Your dashboard", detail: "Model your path with live assumptions", href: "/dashboard", keywords: "home my future simulator" },
  { kind: "page", id: "start", label: "Personalize EconPath", detail: "Answer a few questions to build your dashboard", href: "/start", keywords: "onboarding get started setup" },
  { kind: "page", id: "colleges", label: "College ROI Explorer", detail: "Search, filter and compare 55 colleges", href: "/colleges", keywords: "roi college explorer compare schools" },
  { kind: "page", id: "majors", label: "Major Explorer", detail: "Salaries and outcomes for 51 majors", href: "/majors", keywords: "majors fields degrees" },
  { kind: "page", id: "careers", label: "Career Explorer", detail: "Wages and growth for 112 occupations", href: "/careers", keywords: "careers jobs occupations salaries" },
  { kind: "page", id: "cities", label: "City Affordability Explorer", detail: "Rent, prices and purchasing power in 53 metros", href: "/cities", keywords: "cities cost of living rent affordability salary translator" },
  { kind: "page", id: "simulator", label: "Life Path Simulator", detail: "Model finances from 18 to 40", href: "/simulator", keywords: "simulator scenario life path timeline" },
  { kind: "page", id: "research", label: "Research Lab", detail: "Methods, models and findings", href: "/research", keywords: "research regression study" },
  { kind: "page", id: "tools", label: "Financial tools", detail: "Loan, tax and savings calculators", href: "/tools", keywords: "calculator loan tax savings compound interest" },
  { kind: "page", id: "methodology", label: "Methodology", detail: "How every number is calculated", href: "/methodology", keywords: "methodology assumptions how calculated roi purchasing power" },
  { kind: "page", id: "sources", label: "Data sources", detail: "Publishers, vintages and update dates", href: "/sources", keywords: "sources data bls census bea scorecard" },
];

export const STORIES: SearchEntry[] = [
  { kind: "story", id: "is-college-worth-it", label: "Is College Still Worth It?", detail: "Economic story", href: "/research#stories", keywords: "story college worth it" },
  { kind: "story", id: "gen-z-afford", label: "Where Can Gen Z Actually Afford to Live?", detail: "Economic story", href: "/research#stories", keywords: "story gen z afford live rent" },
  { kind: "story", id: "100k-across-america", label: "What Does $100,000 Feel Like Across America?", detail: "Economic story", href: "/research#stories", keywords: "story 100k salary purchasing power" },
];

let cachedIndex: SearchEntry[] | null = null;

export function searchIndex(): SearchEntry[] {
  if (cachedIndex) return cachedIndex;
  cachedIndex = [
    ...PAGES,
    ...colleges.map((c) => ({
      kind: "college" as const,
      id: c.id,
      label: c.name,
      detail: `${c.control === "public" ? "Public" : "Private"} · ${c.state}`,
      href: `/colleges/${c.id}`,
      keywords: `${c.shortName} ${c.id.replace(/-/g, " ")} college university`,
    })),
    ...majors.map((m) => ({
      kind: "major" as const,
      id: m.id,
      label: m.name,
      detail: `${m.category} major`,
      href: `/majors#${m.id}`,
      keywords: `${m.category} major`,
    })),
    ...occupations.map((o) => ({
      kind: "career" as const,
      id: o.id,
      label: o.title,
      detail: `${o.category} · SOC ${o.socCode}`,
      href: `/careers#${o.id}`,
      keywords: `${o.category} career job salary salaries`,
    })),
    ...cities.map((c) => ({
      kind: "city" as const,
      id: c.id,
      label: `${c.name}, ${c.state}`,
      detail: "City",
      href: `/cities#${c.id}`,
      keywords: `${c.region} city metro cost of living`,
    })),
    ...STORIES,
  ];
  return cachedIndex;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Best college match for a free-text name ("ucla", "georgia tech", "berkeley"). */
export function matchCollege(text: string) {
  const q = norm(text);
  if (!q) return undefined;
  let best: { id: string; score: number } | undefined;
  for (const c of colleges) {
    const names = [c.shortName, c.name, c.id.replace(/-/g, " ")].map(norm);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 100);
      else if (n.startsWith(q)) score = Math.max(score, 80);
      else if (n.includes(q)) score = Math.max(score, 60);
      else if (q.split(" ").every((w) => n.includes(w))) score = Math.max(score, 40);
    }
    if (score && (!best || score > best.score)) best = { id: c.id, score };
  }
  return best?.id;
}

export interface Intent {
  label: string;
  href: string;
}

/** Recognize natural-language commands typed into the palette. */
export function parseIntent(input: string): Intent | null {
  const q = input.trim();
  const compare = q.match(/^compare\s+(.+)$/i);
  if (compare) {
    const parts = compare[1].split(/\s*(?:,|\band\b|\bvs\.?\b|\bversus\b|&)\s*/i).filter(Boolean);
    const ids = [...new Set(parts.map(matchCollege).filter((id): id is string => Boolean(id)))].slice(0, 5);
    if (ids.length >= 2) {
      const names = ids.map((id) => colleges.find((c) => c.id === id)!.shortName);
      return { label: `Compare ${names.join(" vs ")}`, href: `/colleges/compare?ids=${ids.join(",")}` };
    }
  }
  const salaries = q.match(/^(?:show\s+)?(.+?)\s+(?:salaries|salary|pay|wages)$/i);
  if (salaries) {
    const term = norm(salaries[1]).replace(/s$/, "");
    const occ = occupations.find((o) => norm(o.title).includes(term) || term.split(" ").every((w) => norm(o.title).includes(w)));
    if (occ) return { label: `Show ${occ.title} salaries`, href: `/careers#${occ.id}` };
  }
  const open = q.match(/^(?:open|go to)\s+(.+)$/i);
  if (open) {
    const term = norm(open[1]);
    const page = PAGES.find((p) => norm(`${p.label} ${p.keywords}`).includes(term) || term.split(" ").every((w) => norm(`${p.label} ${p.keywords}`).includes(w)));
    if (page) return { label: `Open ${page.label}`, href: page.href };
  }
  const find = q.match(/^find\s+(.+?)\s+majors?$/i);
  if (find) {
    const term = norm(find[1]);
    const major = majors.find((m) => norm(m.name).includes(term));
    if (major) return { label: `Find ${major.name}`, href: `/majors#${major.id}` };
  }
  return null;
}
