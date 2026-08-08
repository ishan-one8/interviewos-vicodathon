"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "./useInView";

interface ScoreArcProps {
  score: number;
  max?: number;
  levelLabel?: string;
  size?: number;
}

/**
 * Animated radial score gauge. On first scroll-into-view the arc sweeps to the
 * value and the number counts up. Static (final value) under reduced motion.
 */
export function ScoreArc({ score, max = 100, levelLabel, size = 180 }: ScoreArcProps) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [display, setDisplay] = useState(0);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.75; // 270° gauge
  const arcLen = circumference * sweep;
  const pct = Math.max(0, Math.min(1, score / max));

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => setDisplay(score));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, score]);

  const dashOffset = inView ? arcLen * (1 - pct) : arcLen;

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-[225deg]">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
        />
        {/* value */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none" stroke="url(#arcGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold font-mono text-zinc-50">{display}</span>
          <span className="text-base font-mono text-zinc-600">/{max}</span>
        </div>
        {levelLabel && (
          <span className="mt-1 text-[10px] font-mono uppercase tracking-widest text-indigo-300">
            {levelLabel}
          </span>
        )}
      </div>
    </div>
  );
}
