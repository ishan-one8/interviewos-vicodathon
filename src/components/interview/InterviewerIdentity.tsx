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
  statusText = "Senior AI Systems Interviewer",
  isProcessing = false,
}: InterviewerIdentityProps) {
  const avatarDimensions = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  }[size];

  return (
    <div className="flex items-center gap-3">
      {/* Abstract Orbit Signal Mark */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-mono font-bold shadow-md shadow-indigo-950/40 shrink-0 ${avatarDimensions}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-indigo-400"
        >
          <circle cx="12" cy="12" r="3" className="fill-indigo-400/20" />
          <path d="M12 3a9 9 0 0 1 9 9" className="text-indigo-400/80" />
          <path d="M3 12a9 9 0 0 1 9-9" className="text-indigo-500/50" />
          <path d="M12 21a9 9 0 0 1-9-9" className="text-indigo-400/80" />
          <path d="M21 12a9 9 0 0 1-9 9" className="text-indigo-500/50" />
        </svg>

        {/* Live Indicator Dot */}
        {isProcessing ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
        ) : (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
        )}
      </div>

      {/* Ari Identity Text */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">Ari</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
            Interviewer
          </span>
        </div>
        {showStatus && (
          <p className="text-xs text-zinc-400 font-medium">
            {isProcessing ? "Analyzing & thinking..." : statusText}
          </p>
        )}
      </div>
    </div>
  );
}
