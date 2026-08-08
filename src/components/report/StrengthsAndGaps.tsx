"use client";

import React from "react";
import { ReportFinding } from "@/types/interview";
import { CheckCircle2 } from "lucide-react";

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
    <div className="space-y-6">
      {/* Strengths */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-5">
        <div className="pb-3 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-zinc-200">Verified Strengths</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strengths.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-lg bg-[var(--background)] border border-indigo-500/15 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm text-zinc-200 leading-snug">{s.title}</h3>
                {s.topics.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/8 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] shrink-0">
                    {s.topics[0]}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">{s.description}</p>

              {s.evidenceIds.length > 0 && (
                <div className="text-[10px] font-mono text-zinc-600 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span>Evidence: {s.evidenceIds.join(", ")}</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Development Areas */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-5">
        <div className="pb-3 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-zinc-200">Development Areas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {developmentAreas.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-lg bg-[var(--background)] border border-amber-500/15 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm text-zinc-200 leading-snug">{d.title}</h3>
                {d.topics.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/8 text-amber-400 border border-amber-500/20 font-mono text-[10px] shrink-0">
                    {d.topics[0]}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-4">
          <div className="pb-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-zinc-200">Recommended Next Steps</h3>
          </div>

          <div className="space-y-2">
            {nextSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--border-subtle)] text-[11px] text-zinc-300"
              >
                <span className="h-5 w-5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-400 shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
