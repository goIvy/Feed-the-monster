"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  GraduationCap,
  Heart,
  MapPin,
  School,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  assumptionsFromProfile,
  DASHBOARD_KEY,
  EMPTY_PROFILE,
  pathsFromProfile,
  PROFILE_KEY,
  type DashboardState,
  type Profile,
  type Stage,
} from "@/features/dashboard/state";
import { navigate } from "@/lib/navigate";
import { cn } from "@/lib/utils";
import { careerOptions, cityOptions, collegeOptions, majorOptions } from "@/services/options";

const INTERESTS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "colleges", label: "Colleges", icon: Building2 },
  { value: "majors", label: "Majors", icon: GraduationCap },
  { value: "careers", label: "Careers", icon: Briefcase },
  { value: "cities", label: "Cities", icon: MapPin },
  { value: "scenarios", label: "Financial scenarios", icon: BarChart3 },
];

const STAGES: { value: Stage; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "high-school", label: "High school", hint: "Planning for college", icon: School },
  { value: "college", label: "College", hint: "Choosing a major or career", icon: GraduationCap },
  { value: "recent-grad", label: "Recent graduate", hint: "Starting a career", icon: Sparkles },
  { value: "parent", label: "Parent or family", hint: "Helping someone decide", icon: Heart },
  { value: "counselor", label: "Counselor", hint: "Advising students", icon: Users },
];

type StepKey = "interests" | "stage" | "careers" | "majors" | "colleges" | "home" | "cities" | "finances";

const STEPS: { key: StepKey; title: string; help: string }[] = [
  { key: "interests", title: "What would you like to compare?", help: "Pick as many as you like." },
  { key: "stage", title: "Which best describes you?", help: "We'll tailor explanations and defaults." },
  { key: "careers", title: "What careers are you considering?", help: "Choose up to three. Skip if you're not sure yet." },
  { key: "majors", title: "What majors are you considering?", help: "Choose up to three." },
  { key: "colleges", title: "Which colleges are on your list?", help: "Choose up to three. You can compare more later." },
  { key: "home", title: "Where do you live now?", help: "Used to decide in-state versus out-of-state tuition." },
  { key: "cities", title: "Where might you want to live after college?", help: "Choose up to three metro areas." },
  { key: "finances", title: "Optional: your financial picture", help: "Leave any field blank to use typical values for each college." },
];

const FINANCE_FIELDS: { key: keyof Profile["finances"]; label: string; hint: string }[] = [
  { key: "householdIncome", label: "Household income", hint: "Per year. Stored on this device only." },
  { key: "grantAid", label: "Expected grant aid", hint: "Grants per year. Replaces the college's average aid." },
  { key: "loans", label: "Expected student loans", hint: "Total for the degree." },
  { key: "savingsContribution", label: "Family or savings contribution", hint: "Per year toward college." },
  { key: "scholarship", label: "Scholarship amount", hint: "Per year, beyond typical aid." },
];

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  hint,
  role = "checkbox",
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  hint?: string;
  role?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
        selected ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-border-strong",
      )}
    >
      <span className={cn("grid size-10 place-items-center rounded-xl transition", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className={cn("grid size-5 place-items-center rounded-full border transition", selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
        {selected && <Check className="size-3" />}
      </span>
    </button>
  );
}

function parseMoney(raw: string): number | null {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return raw.trim() === "" || Number.isNaN(n) ? null : Math.round(n);
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const go = (delta: number) => {
    setDir(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  };

  const finish = () => {
    const done: Profile = { ...profile, completed: true };
    const dashboard: DashboardState = { version: 1, paths: pathsFromProfile(done), assumptions: assumptionsFromProfile(done) };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(done));
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboard));
    } catch {
      // Storage can be unavailable (private mode); the dashboard falls back to defaults.
    }
    navigate(router, "/dashboard?welcome=1");
  };

  const answered: Record<StepKey, boolean> = {
    interests: profile.interests.length > 0,
    stage: profile.stage != null,
    careers: profile.careers.length > 0,
    majors: profile.majors.length > 0,
    colleges: profile.colleges.length > 0,
    home: profile.homeCityId != null,
    cities: profile.targetCities.length > 0,
    finances: Object.values(profile.finances).some((v) => v != null),
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular">
          Step {step + 1} of {STEPS.length}
        </span>
        <button type="button" onClick={finish} className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Skip to dashboard
        </button>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <motion.span
              className="block h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </span>
        ))}
      </div>

      <div className="relative mt-10 min-h-[420px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={current.key}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            aria-labelledby="step-title"
          >
            <h1 id="step-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {current.title}
            </h1>
            <p className="mt-3 text-muted-foreground">{current.help}</p>

            <div className="mt-8">
              {current.key === "interests" && (
                <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Interests">
                  {INTERESTS.map((o) => (
                    <OptionCard
                      key={o.value}
                      icon={o.icon}
                      label={o.label}
                      selected={profile.interests.includes(o.value)}
                      onClick={() =>
                        update(
                          "interests",
                          profile.interests.includes(o.value) ? profile.interests.filter((x) => x !== o.value) : [...profile.interests, o.value],
                        )
                      }
                    />
                  ))}
                </div>
              )}
              {current.key === "stage" && (
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Stage">
                  {STAGES.map((o) => (
                    <OptionCard key={o.value} role="radio" icon={o.icon} label={o.label} hint={o.hint} selected={profile.stage === o.value} onClick={() => update("stage", o.value)} />
                  ))}
                </div>
              )}
              {current.key === "careers" && (
                <MultiCombobox aria-label="Careers" placeholder="Search 112 careers, e.g. Financial Analyst" options={careerOptions} values={profile.careers} onChange={(v) => update("careers", v)} />
              )}
              {current.key === "majors" && (
                <MultiCombobox aria-label="Majors" placeholder="Search 51 majors, e.g. Economics" options={majorOptions} values={profile.majors} onChange={(v) => update("majors", v)} />
              )}
              {current.key === "colleges" && (
                <MultiCombobox aria-label="Colleges" placeholder="Search 55 colleges, e.g. UCLA" options={collegeOptions} values={profile.colleges} onChange={(v) => update("colleges", v)} />
              )}
              {current.key === "home" && (
                <Combobox aria-label="Current city" placeholder="Search metro areas" options={cityOptions} value={profile.homeCityId} onChange={(v) => update("homeCityId", v)} allowClear />
              )}
              {current.key === "cities" && (
                <MultiCombobox aria-label="Target cities" placeholder="Search 53 metro areas, e.g. Los Angeles" options={cityOptions} values={profile.targetCities} onChange={(v) => update("targetCities", v)} />
              )}
              {current.key === "finances" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {FINANCE_FIELDS.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-sm font-medium">{f.label}</span>
                      <div className="relative mt-1.5">
                        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle-foreground">$</span>
                        <Input
                          inputMode="numeric"
                          className="pl-7 tabular"
                          placeholder="Optional"
                          value={profile.finances[f.key]?.toLocaleString("en-US") ?? ""}
                          onChange={(e) => update("finances", { ...profile.finances, [f.key]: parseMoney(e.target.value) })}
                        />
                      </div>
                      <span className="mt-1 block text-xs text-muted-foreground">{f.hint}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Button variant="ghost" onClick={() => go(-1)} disabled={step === 0}>
          <ArrowLeft /> Back
        </Button>
        <div className="flex items-center gap-2">
          {!answered[current.key] && !isLast && (
            <Button variant="ghost" onClick={() => go(1)}>
              Skip
            </Button>
          )}
          {isLast ? (
            <Button onClick={finish}>
              Build my dashboard <Sparkles />
            </Button>
          ) : (
            <Button onClick={() => go(1)} disabled={!answered[current.key]}>
              Continue <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
