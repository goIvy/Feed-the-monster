import { GraduationCap, Heart, School, Users } from "lucide-react";

const AUDIENCES = [
  { icon: GraduationCap, who: "Students", what: "See what a college, major and city could mean for your budget at 25, not just your admission odds." },
  { icon: Heart, who: "Families", what: "Compare net price, borrowing and payback across schools with the same assumptions." },
  { icon: Users, who: "Counselors", what: "Build side-by-side comparisons and print a clear report for a family meeting." },
  { icon: School, who: "Teachers", what: "Use real public data to teach opportunity cost, inflation, taxes and present value." },
];

export function Audiences() {
  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map(({ icon: Icon, who, what }) => (
          <li key={who} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <Icon className="size-5 text-primary" />
            <p className="mt-4 font-semibold">{who}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{what}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-xl border border-dashed border-border-strong px-4 py-3 text-center text-sm text-muted-foreground">
        Testimonials from our student and counselor pilot will appear here once participants share them.
      </p>
    </div>
  );
}
