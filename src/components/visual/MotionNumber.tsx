"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "./useInView";

interface MotionNumberProps {
  value: number;
  className?: string;
  durationMs?: number;
  suffix?: string;
}

/** Counts up to `value` once scrolled into view. Static under reduced-motion. */
export function MotionNumber({ value, className = "", durationMs = 900, suffix = "" }: MotionNumberProps) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.5);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
