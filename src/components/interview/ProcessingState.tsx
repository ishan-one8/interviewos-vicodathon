"use client";

import React from "react";

const STAGES = [
  { label: "Reading response", color: "#818cf8" },
  { label: "Updating strategy", color: "#22d3ee" },
  { label: "Preparing next probe", color: "#a78bfa" },
];

export function ProcessingState() {
  return (
    <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.03] p-6 animate-fade-in">
      <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-300 uppercase tracking-wider mb-5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
        </span>
        Ari is adapting
      </div>

      {/* Stage sequence with traveling light */}
      <div className="relative flex items-center justify-between">
        {/* connecting track */}
        <div className="absolute left-4 right-4 top-[7px] h-px bg-gradient-to-r from-indigo-500/30 via-cyan-500/30 to-violet-500/30" />
        {/* traveling light */}
        <div
          className="absolute top-[5px] h-1 w-8 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
            animation: "beam-sweep 2s ease-in-out infinite",
            left: "0%",
          }}
        />

        {STAGES.map((stage, i) => (
          <div key={stage.label} className="relative z-10 flex flex-col items-center gap-2 flex-1">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span
                className="absolute h-3.5 w-3.5 rounded-full"
                style={{ background: stage.color, opacity: 0.3, animation: "glow-pulse 1.5s ease-in-out infinite", animationDelay: `${i * 500}ms` }}
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: stage.color, boxShadow: `0 0 8px ${stage.color}`, animation: "core-breathe 1.5s ease-in-out infinite", animationDelay: `${i * 500}ms` }}
              />
            </span>
            <span className="text-[10px] font-mono text-zinc-500 text-center leading-tight">
              {stage.label}
            </span>
          </div>
        ))}
      </div>

      {/* Shimmer preview lines */}
      <div className="mt-6 space-y-2">
        <div className="h-3 rounded bg-zinc-800/40 w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-zinc-800/30 w-1/2 animate-pulse" style={{ animationDelay: "150ms" }} />
      </div>
    </div>
  );
}
