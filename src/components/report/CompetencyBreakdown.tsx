"use client";

import React, { useState } from "react";
import { CompetencyDimension, CompetencyResult, ScoreExplanation } from "@/types/interview";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from "lucide-react";
import { useInView } from "@/components/visual/useInView";

interface CompetencyBreakdownProps {
  competencies: Record<CompetencyDimension, CompetencyResult>;
  scoreExplanations?: Record<CompetencyDimension, ScoreExplanation>;
}

const COMPETENCY_LABELS: Record<CompetencyDimension, string> = {
  correctness: "Correctness",
  depth: "Technical Depth",
  reasoning: "Reasoning & Problem Solving",
  practicalUnderstanding: "Practical Understanding",
  tradeoffAwareness: "Trade-off Awareness",
};

const DIMENSIONS: CompetencyDimension[] = [
  "correctness",
  "depth",
  "reasoning",
  "practicalUnderstanding",
  "tradeoffAwareness",
];

export function CompetencyBreakdown({
  competencies,
  scoreExplanations,
}: CompetencyBreakdownProps) {
  const [expandedDim, setExpandedDim] = useState<CompetencyDimension | null>(null);
  const [ref, inView] = useInView<HTMLDivElement>(0.2);

  const toggleExpand = (dim: CompetencyDimension) => {
    setExpandedDim((prev) => (prev === dim ? null : dim));
  };

  return (
    <div ref={ref} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-5">
      <div className="pb-4 border-b border-[var(--border)]">
        <h2 className="text-base font-bold text-zinc-100">Competency Breakdown</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">5 core engineering dimensions</p>
      </div>

      <div className="space-y-3">
        {DIMENSIONS.map((dim) => {
          const comp = competencies[dim];
          const explanation = scoreExplanations?.[dim];
          const isInsufficient = comp.status === "insufficient_evidence" || comp.evidenceCount === 0;
          const isExpanded = expandedDim === dim;

          return (
            <div
              key={dim}
              className="rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] p-4 space-y-3 transition-colors hover:border-indigo-500/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-zinc-200">{COMPETENCY_LABELS[dim]}</h3>
                    {isInsufficient ? (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50 font-mono text-[10px]">
                        Insufficient Evidence
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/8 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] capitalize">
                        {comp.status}
                      </span>
                    )}
                  </div>
                  {!isInsufficient && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-600">
                        {comp.evidenceCount} evidence · {(comp.confidence * 100).toFixed(0)}% confidence
                      </span>
                      {/* evidence dots */}
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(6, comp.evidenceCount) }).map((_, i) => (
                          <span key={i} className="h-1 w-1 rounded-full bg-indigo-400/60" />
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isInsufficient && (
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {comp.normalizedScore}
                      <span className="text-zinc-600 text-sm">/100</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(dim)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] hover:border-indigo-500/40 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <span>{isExpanded ? "Hide" : "Why?"}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {!isInsufficient && (
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="bar-fill h-full rounded-full"
                    style={{
                      width: inView ? `${comp.normalizedScore}%` : "0%",
                      background: "linear-gradient(90deg, #6366f1, #22d3ee)",
                    }}
                  />
                </div>
              )}

              {isExpanded && (
                <div className="pt-3 border-t border-[var(--border)] space-y-3 animate-fade-in">
                  <p className="text-[11px] text-zinc-500 font-mono bg-[var(--surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    {explanation?.weightingSummary || "Performance averaged across difficulty-weighted interview turns."}
                  </p>

                  {explanation && explanation.supportingEvidence.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-emerald-500 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Supporting Evidence ({explanation.supportingEvidence.length})
                      </div>
                      {explanation.supportingEvidence.map((ev) => (
                        <div key={ev.evidenceId} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-500">
                            <span>{ev.evidenceId}</span>
                            <span>{ev.score.toFixed(1)}/4 · {ev.weight.toFixed(2)}x</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{ev.statement}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {explanation && explanation.gapEvidence.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-amber-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Development Gaps ({explanation.gapEvidence.length})
                      </div>
                      {explanation.gapEvidence.map((ev) => (
                        <div key={ev.evidenceId} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400">
                            <span>{ev.evidenceId}</span>
                            <span>{ev.score.toFixed(1)}/4</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{ev.statement}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
