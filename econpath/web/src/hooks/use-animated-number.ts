"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Tween toward `target` whenever it changes; jumps immediately under reduced motion. */
export function useAnimatedNumber(target: number, duration = 0.7): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduce) {
      current.current = target;
      return;
    }
    const controls = animate(current.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        setValue(v);
      },
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return reduce ? target : value;
}
