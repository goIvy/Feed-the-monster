import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "College ROI Explorer", href: "/colleges" },
      { label: "Majors", href: "/majors" },
      { label: "Careers", href: "/careers" },
      { label: "Cities", href: "/cities" },
      { label: "Life Path Simulator", href: "/simulator" },
    ],
  },
  {
    title: "Use EconPath",
    links: [
      { label: "Personalize", href: "/start" },
      { label: "Your dashboard", href: "/dashboard" },
      { label: "Compare colleges", href: "/colleges/compare?ids=ucla,uc-berkeley,usc" },
      { label: "Tools", href: "/tools" },
      { label: "Research Lab", href: "/research" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Methodology", href: "/methodology" },
      { label: "Data sources", href: "/sources" },
      { label: "Limitations", href: "/methodology#limitations" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-border bg-background-elevated">
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Understand the economics behind your future. EconPath shows tradeoffs, assumptions and data. It does not
            tell you what to choose.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-[13px] font-semibold">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-subtle-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EconPath. Estimates are projections, not guarantees.</p>
          <p>Built on public data from the BLS, Census Bureau, BEA, Department of Education and the Federal Reserve.</p>
        </div>
      </div>
    </footer>
  );
}
