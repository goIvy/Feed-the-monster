"use client";

import { ChevronDown, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useCommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXPLORE_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: NavItem["status"] }) {
  if (status === "preview") return <Badge variant="teal">Preview</Badge>;
  if (status === "soon") return <Badge variant="muted">Soon</Badge>;
  return null;
}

function NavTile({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex gap-3 rounded-xl p-2.5 transition hover:bg-muted focus-visible:bg-muted"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary shadow-soft transition group-hover:border-border-strong">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          {item.label}
          <StatusBadge status={item.status} />
        </span>
        <span className="block text-[12.5px] leading-snug text-muted-foreground">{item.description}</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "no-print sticky top-0 z-40 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled ? "glass border-border shadow-soft" : "border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lift"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" aria-label="EconPath home" className="shrink-0 rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          <Popover open={exploreOpen} onOpenChange={setExploreOpen}>
            <PopoverTrigger className="flex h-9 items-center gap-1 rounded-full px-3 text-[13.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
              Explore
              <ChevronDown className="size-3.5 transition-transform in-data-[state=open]:rotate-180" />
            </PopoverTrigger>
            <PopoverContent className="w-[620px] p-2" align="start">
              <div className="grid grid-cols-2 gap-1">
                {EXPLORE_NAV.map((item) => (
                  <NavTile key={item.href} item={item} onNavigate={() => setExploreOpen(false)} />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-[12.5px] text-muted-foreground">
                <span>Every number links to its source and method.</span>
                <Link href="/methodology" onClick={() => setExploreOpen(false)} className="font-medium text-primary hover:underline">
                  Read the methodology
                </Link>
              </div>
            </PopoverContent>
          </Popover>
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex h-9 items-center rounded-full px-3 text-[13.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                isActive(item.href) && "bg-muted text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={open}
            className="hidden h-9 w-52 items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-[13px] text-subtle-foreground shadow-soft transition hover:border-border-strong hover:text-muted-foreground md:flex xl:w-60"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={open} aria-label="Search">
            <Search />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/start">Get started</Link>
          </Button>

          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </DialogTrigger>
            <DialogContent className="top-3 max-h-[calc(100dvh-24px)] overflow-y-auto p-3">
              <DialogTitle className="px-2.5 pt-2 pb-3 text-sm font-semibold">Menu</DialogTitle>
              <nav aria-label="Mobile" className="grid gap-0.5">
                {EXPLORE_NAV.map((item) => (
                  <NavTile key={item.href} item={item} onNavigate={() => setMenuOpen(false)} />
                ))}
              </nav>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border p-2 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/start" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
