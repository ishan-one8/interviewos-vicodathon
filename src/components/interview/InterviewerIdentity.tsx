"use client";

import React from "react";

interface InterviewerIdentityProps {
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  statusText?: string;
  isProcessing?: boolean;
}

export function InterviewerIdentity({
  size = "md",
  showStatus = true,
  statusText = "AI Systems Interviewer",
  isProcessing = false,
}: InterviewerIdentityProps) {
  const dims = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }[size];

  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative flex items-center justify-center rounded-lg bg-indigo-600/8 border border-indigo-500/20 shrink-0 ${dims}`}>
        <svg viewBox="0 0 20 20" fill="none" className={iconSize}>
          <circle cx="10" cy="10" r="2.5" className="fill-indigo-400" />
          <path d="M10 3a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-400/70" />
          <path d="M3 10a7 7 0 0 1 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500/40" />
          <path d="M10 17a7 7 0 0 1-7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-400/70" />
          <path d="M17 10a7 7 0 0 1-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500/40" />
        </svg>

        {isProcessing ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        ) : (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-[var(--background)]" />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-200 text-sm tracking-tight">Ari</span>
          <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-px rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">
            Interviewer
          </span>
        </div>
        {showStatus && (
          <p className="text-[11px] text-zinc-500 truncate">
            {isProcessing ? "Analyzing response..." : statusText}
          </p>
        )}
      </div>
    </div>
  );
}
