"use client";

import React from "react";

interface ProductMockupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A browser-window-style frame with an edge glow, used to showcase real
 * InterviewOS surfaces in the marketing showcase. Decorative chrome only.
 */
export function ProductMockup({ title, children, className = "", style }: ProductMockupProps) {
  return (
    <div
      className={`gradient-border rounded-xl overflow-hidden border border-white/10 bg-[var(--surface)]/90 backdrop-blur-md shadow-2xl shadow-black/60 ${className}`}
      style={style}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--background)]/60">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[10px] font-mono text-zinc-500 truncate">{title}</span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
