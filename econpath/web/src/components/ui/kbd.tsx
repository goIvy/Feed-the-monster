import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border-strong bg-card px-1.5 font-sans text-[11px] font-medium text-muted-foreground shadow-[0_1px_0_var(--border-strong)]",
        className,
      )}
      {...props}
    />
  );
}
