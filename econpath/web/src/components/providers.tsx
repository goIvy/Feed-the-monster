"use client";

import { ThemeProvider } from "next-themes";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
