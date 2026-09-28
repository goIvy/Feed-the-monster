import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm shadow-soft outline-none transition-[border-color,box-shadow] placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
