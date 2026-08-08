"use client";

import React from "react";

interface FloatingPanelProps {
  label: string;
  body?: string;
  accent?: "indigo" | "cyan" | "violet" | "emerald";
  variant?: "a" | "b";
  className?: string;
  style?: React.CSSProperties;
}

const ACCENTS = {
  indigo: { text: "text-indigo-300", dot: "#818cf8" },
  cyan: { text: "text-cyan-300", dot: "#22d3ee" },
  violet: { text: "text-violet-300", dot: "#a78bfa" },
  emerald: { text: "text-emerald-300", dot: "#34d399" },
};

/**
 * Small floating product-preview panel with slight perspective and drift.
 * Used to orbit the hero intelligence core.
 */
export function FloatingPanel({
  label,
  body,
  accent = "indigo",
  variant = "a",
  className = "",
  style,
}: FloatingPanelProps) {
  const a = ACCENTS[accent];
  return (
    <div
      className={`absolute ${variant === "a" ? "float-persp-a" : "float-persp-b"} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-xl shadow-2xl shadow-black/50 min-w-[128px]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: a.dot }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: a.dot, boxShadow: `0 0 6px ${a.dot}` }} />
          </span>
          <span className={`text-[9px] font-mono uppercase tracking-wider ${a.text}`}>{label}</span>
        </div>
        {body && <p className="mt-1 text-[11px] text-zinc-300 leading-snug max-w-[150px]">{body}</p>}
      </div>
    </div>
  );
}
