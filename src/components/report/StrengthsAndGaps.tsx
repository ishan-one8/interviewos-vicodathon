"use client";

import React from "react";
import { ReportFinding } from "@/types/interview";
import { Sparkles, ArrowUpRight, Target, CheckCircle2 } from "lucide-react";

interface StrengthsAndGapsProps {
  strengths: ReportFinding[];
  developmentAreas: ReportFinding[];
  nextSteps: string[];
}

export function StrengthsAndGaps({
  strengths,
  developmentAreas,
  nextSteps,
}: StrengthsAndGapsProps) {
  return (
    <div className="space-y-8">
      {/* 1. Verified Key Strengths */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Verified Technical Strengths</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-zinc-950/70 border border-indigo-500/20 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-zinc-100 leading-snug">{s.title}</h3>
                {s.topics.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]">
                    {s.topics[0]}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium">{s.description}</p>

              {s.evidenceIds.length > 0 && (
                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <span>Evidence Links: {s.evidenceIds.join(", ")}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Development Areas */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
          <Target className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Development & Practice Areas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {developmentAreas.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-zinc-950/70 border border-amber-500/20 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-zinc-100 leading-snug">{d.title}</h3>
                {d.topics.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px]">
                    {d.topics[0]}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Actionable Next Steps (Section 11) */}
      {nextSteps.length > 0 && (
        <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/20 to-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <ArrowUpRight className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-zinc-100">Recommended Next Steps</h3>
          </div>

          <div className="space-y-3">
            {nextSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-200"
              >
                <span className="h-6 w-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-indigo-400 shrink-0">
                  {idx + 1}
                </span>
                <span className="pt-0.5 leading-relaxed font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
