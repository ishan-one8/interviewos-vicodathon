"use client";

import React, { useState } from "react";
import { CompetencyDimension, CompetencyResult, ScoreExplanation } from "@/types/interview";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, HelpCircle, Layers } from "lucide-react";

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

export function CompetencyBreakdown({
  competencies,
  scoreExplanations,
}: CompetencyBreakdownProps) {
  const [expandedDim, setExpandedDim] = useState<CompetencyDimension | null>(null);

  const dimensions: CompetencyDimension[] = [
    "correctness",
    "depth",
    "reasoning",
    "practicalUnderstanding",
    "tradeoffAwareness",
  ];

  const toggleExpand = (dim: CompetencyDimension) => {
    setExpandedDim((prev) => (prev === dim ? null : dim));
  };

  return (
    <div className="w-full bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Competency Breakdown</h2>
          <p className="text-xs text-zinc-400">
            Demonstrated technical ability evaluated across 5 core engineering dimensions.
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-500">5 Dimensions</span>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim) => {
          const comp = competencies[dim];
          const explanation = scoreExplanations?.[dim];
          const isInsufficient = comp.status === "insufficient_evidence" || comp.evidenceCount === 0;
          const isExpanded = expandedDim === dim;

          return (
            <div
              key={dim}
              className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-4 transition-all"
            >
              {/* Main Competency Bar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-zinc-100">
                      {COMPETENCY_LABELS[dim]}
                    </h3>

                    {isInsufficient ? (
                      <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono text-[10px] font-semibold uppercase">
                        Insufficient Evidence
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-semibold uppercase">
                        {comp.status}
                      </span>
                    )}
                  </div>

                  {isInsufficient ? (
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <HelpCircle className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>Not enough interview evidence was collected to assess this competency reliably.</span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Based on {comp.evidenceCount} evidence observations ({(comp.confidence * 100).toFixed(0)}% confidence).
                    </p>
                  )}
                </div>

                {/* Score & Expand Action */}
                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  {!isInsufficient ? (
                    <div className="text-right font-mono">
                      <div className="text-2xl font-bold text-zinc-100">{comp.normalizedScore}</div>
                      <div className="text-[10px] text-zinc-500">/ 100</div>
                    </div>
                  ) : (
                    <div className="text-right font-mono text-xs text-zinc-500 italic">
                      Unassessed
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(dim)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors focus:outline-none"
                  >
                    <span>{isExpanded ? "Hide Trace" : "Why this score?"}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Score Bar */}
              {!isInsufficient && (
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${comp.normalizedScore}%` }}
                  />
                </div>
              )}

              {/* Score Explainability Expanded Trace (Section 7) */}
              {isExpanded && (
                <div className="pt-4 border-t border-zinc-800/80 space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs font-mono text-indigo-400 font-semibold flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Evidence Trace & Weighting Summary</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                    {explanation?.weightingSummary || "Demonstrated performance averaged across difficulty-weighted interview turns."}
                  </p>

                  {/* Supporting Evidence */}
                  {explanation && explanation.supportingEvidence.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Supporting Evidence ({explanation.supportingEvidence.length})
                      </div>
                      <div className="space-y-2">
                        {explanation.supportingEvidence.map((ev) => (
                          <div
                            key={ev.evidenceId}
                            className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-semibold">
                              <span>ID: {ev.evidenceId}</span>
                              <span>Score: {ev.score.toFixed(1)}/4 (Weight: {ev.weight.toFixed(2)}x)</span>
                            </div>
                            <p className="text-zinc-200 leading-relaxed">{ev.statement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gap Evidence */}
                  {explanation && explanation.gapEvidence.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Development Gaps ({explanation.gapEvidence.length})
                      </div>
                      <div className="space-y-2">
                        {explanation.gapEvidence.map((ev) => (
                          <div
                            key={ev.evidenceId}
                            className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-semibold">
                              <span>ID: {ev.evidenceId}</span>
                              <span>Score: {ev.score.toFixed(1)}/4</span>
                            </div>
                            <p className="text-zinc-200 leading-relaxed">{ev.statement}</p>
                          </div>
                        ))}
                      </div>
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
