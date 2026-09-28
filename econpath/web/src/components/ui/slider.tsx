"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = props.value ?? props.defaultValue ?? [0];
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none items-center py-2 select-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={props["aria-label"]}
          className="block size-[18px] rounded-full border border-border-strong bg-card shadow-[0_1px_3px_rgba(16,24,40,0.2)] transition-[box-shadow,transform] hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:outline-none active:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
