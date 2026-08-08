"use client";

import React from "react";

interface AdaptiveLabelProps {
  action: string;
  label: string;
}

const ACTION_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  personalized_start: { text: "text-cyan-300", bg: "bg-cyan-500/8", border: "border-cyan-500/25", dot: "#22d3ee" },
  follow_up: { text: "text-indigo-300", bg: "bg-indigo-500/8", border: "border-indigo-500/25", dot: "#818cf8" },
  deepen: { text: "text-violet-300", bg: "bg-violet-500/8", border: "border-violet-500/25", dot: "#a78bfa" },
  clarify: { text: "text-amber-300", bg: "bg-amber-500/8", border: "border-amber-500/25", dot: "#fbbf24" },
  challenge: { text: "text-rose-300", bg: "bg-rose-500/8", border: "border-rose-500/25", dot: "#fb7185" },
  new_topic: { text: "text-cyan-300", bg: "bg-cyan-500/8", border: "border-cyan-500/25", dot: "#22d3ee" },
};

export function AdaptiveLabel({ action, label }: AdaptiveLabelProps) {
  const c = ACTION_COLORS[action] || ACTION_COLORS.new_topic;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono font-medium tracking-wide uppercase ${c.text} ${c.bg} ${c.border}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: c.dot }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />
      </span>
      {label}
    </span>
  );
}
