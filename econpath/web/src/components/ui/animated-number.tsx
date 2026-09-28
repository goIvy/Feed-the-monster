"use client";

import { useAnimatedNumber } from "@/hooks/use-animated-number";

export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
}) {
  const v = useAnimatedNumber(value);
  return (
    <span className={className}>
      <span aria-hidden>{format(v)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
