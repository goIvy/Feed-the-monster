import { ArrowUpRight, Building2, Clock, Coins, Home, LineChart, MapPin, Scale, TrendingUp } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
  { q: "Is this college worth the cost?", a: "Net price, debt and earnings, weighed against starting work at 18.", href: "/colleges", icon: Building2, tone: "text-primary bg-accent" },
  { q: "Which major gives me the best financial return?", a: "Early and mid-career pay, unemployment and underemployment by major.", href: "/majors", icon: TrendingUp, tone: "text-emerald bg-emerald-soft" },
  { q: "Where can I afford to live with this career?", a: "Rent, prices and taxes turned into what your paycheck actually buys.", href: "/cities", icon: MapPin, tone: "text-teal bg-teal-soft" },
  { q: "How long will it take to pay off my loans?", a: "Borrowing, interest while enrolled and a ten-year repayment plan.", href: "/dashboard", icon: Clock, tone: "text-violet bg-violet-soft" },
  { q: "How does $100,000 in San Francisco compare to Dallas?", a: "Taxes and local prices applied to the same salary.", href: "/cities", icon: Scale, tone: "text-amber bg-amber-soft" },
  { q: "What if tuition, rent or inflation changes?", a: "Move a slider and every chart recalculates instantly.", href: "/dashboard", icon: LineChart, tone: "text-primary bg-accent" },
  { q: "Is a more expensive college actually worth it?", a: "Side-by-side ROI for up to five colleges, with the assumptions shown.", href: "/colleges/compare?ids=ucla,usc,uc-berkeley", icon: Coins, tone: "text-emerald bg-emerald-soft" },
  { q: "Which cities give young adults the best start?", a: "Income, rent, job growth and youth unemployment on one map.", href: "#opportunity-map", icon: Home, tone: "text-teal bg-teal-soft" },
];

export function Questions() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUESTIONS.map(({ q, a, href, icon: Icon, tone }) => (
        <li key={q}>
          <Link
            href={href}
            className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card"
          >
            <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-[18px]" />
            </span>
            <span className="mt-4 text-[15px] leading-snug font-semibold tracking-tight">{q}</span>
            <span className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">{a}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary opacity-80 transition group-hover:opacity-100">
              Explore <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
