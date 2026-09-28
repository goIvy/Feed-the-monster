"use client";

import { useEffect, useRef, useState } from "react";

/** Width of an element, updated on resize. Starts at `initial` for server rendering. */
export function useElementWidth<T extends HTMLElement>(initial = 960) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
