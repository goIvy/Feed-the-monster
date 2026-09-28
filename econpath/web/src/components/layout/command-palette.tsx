"use client";

import { Command } from "cmdk";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CornerDownLeft,
  GraduationCap,
  Layers,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { parseIntent, searchIndex, type SearchKind } from "@/lib/search";

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });
export const useCommandPalette = () => useContext(PaletteContext);

const ICONS: Record<SearchKind, typeof Search> = {
  college: Building2,
  major: GraduationCap,
  career: Briefcase,
  city: MapPin,
  page: Layers,
  story: BookOpen,
};

const GROUPS: { kind: SearchKind; heading: string }[] = [
  { kind: "page", heading: "Go to" },
  { kind: "college", heading: "Colleges" },
  { kind: "major", heading: "Majors" },
  { kind: "career", heading: "Careers" },
  { kind: "city", heading: "Cities" },
  { kind: "story", heading: "Stories" },
];

const SUGGESTIONS = ["Compare Stanford and UCLA", "Show software developer salaries", "Open city explorer", "Find economics majors"];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const index = useMemo(() => searchIndex(), []);
  const intent = useMemo(() => parseIntent(query), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isOpen) {
        const t = e.target as HTMLElement;
        if (t.closest("input, textarea, [contenteditable=true]")) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return index.filter((e) => e.kind === "page").slice(0, 6);
    const words = q.split(/\s+/);
    return index
      .map((e) => {
        const hay = `${e.label} ${e.keywords}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const label = e.label.toLowerCase();
        const score = label.startsWith(q) ? 3 : label.includes(q) ? 2 : 1;
        return { e, score };
      })
      .filter((x): x is { e: (typeof index)[number]; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.e);
  }, [index, q]);

  return (
    <PaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent hideClose className="max-w-xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Search EconPath</DialogTitle>
          <DialogDescription className="sr-only">
            Search colleges, majors, careers, cities and pages, or type a command such as compare UCLA and USC.
          </DialogDescription>
          <Command shouldFilter={false} loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search or type a command…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle-foreground"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto overscroll-contain p-2">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
                No matches. Try a college, major, career, or city.
              </Command.Empty>
              {intent && (
                <Command.Group heading="Command" className={GROUP_CLASS}>
                  <Command.Item value={`intent-${intent.href}`} onSelect={() => go(intent.href)} className={ITEM_CLASS}>
                    <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Sparkles className="size-4" />
                    </span>
                    <span className="flex-1 font-medium">{intent.label}</span>
                    <CornerDownLeft className="size-3.5 text-subtle-foreground" />
                  </Command.Item>
                </Command.Group>
              )}
              {!q && (
                <Command.Group heading="Try asking" className={GROUP_CLASS}>
                  {SUGGESTIONS.map((s) => (
                    <Command.Item key={s} value={`suggest-${s}`} onSelect={() => setQuery(s)} className={ITEM_CLASS}>
                      <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Sparkles className="size-4" />
                      </span>
                      <span className="flex-1">{s}</span>
                      <ArrowRight className="size-3.5 text-subtle-foreground" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {GROUPS.map(({ kind, heading }) => {
                const items = results.filter((r) => r.kind === kind).slice(0, kind === "page" ? 6 : 6);
                if (!items.length) return null;
                const Icon = ICONS[kind];
                return (
                  <Command.Group key={kind} heading={heading} className={GROUP_CLASS}>
                    {items.map((r) => (
                      <Command.Item key={`${r.kind}-${r.id}`} value={`${r.kind}-${r.id}`} onSelect={() => go(r.href)} className={ITEM_CLASS}>
                        <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{r.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{r.detail}</span>
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
            <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> to navigate <Kbd className="ml-2">↵</Kbd> to open
              </span>
              <span className="hidden sm:inline">Search runs on your device</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </PaletteContext.Provider>
  );
}

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-subtle-foreground [&_[cmdk-group-heading]]:uppercase";
const ITEM_CLASS =
  "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground outline-none data-[selected=true]:bg-muted";
