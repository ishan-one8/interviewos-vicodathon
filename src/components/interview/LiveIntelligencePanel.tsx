"use client";

import React from "react";
import { AriCore } from "@/components/visual/AriCore";
import { Check } from "lucide-react";

interface LiveIntelligencePanelProps {
  turnCount: number;
  coveredCurriculumDaysCount: number;
  coveredTopics: string[];
  currentTopic?: string;
  adaptiveLabel?: string;
  isProcessing?: boolean;
}

/**
 * The interview's living context panel — ARI state, current focus area, the
 * active interview signal, and explored areas connected by a signal spine.
 * Surfaces only safe presentation data (no scores, no chain-of-thought).
 */
export function LiveIntelligencePanel({
  turnCount,
  coveredCurriculumDaysCount,
  coveredTopics,
  currentTopic,
  adaptiveLabel,
  isProcessing = false,
}: LiveIntelligencePanelProps) {
  const questionsMet = turnCount >= 8;
  const areasMet = coveredCurriculumDaysCount >= 4;

  return (
    <div className="space-y-4">
      {/* ARI status */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <AriCore state={isProcessing ? "analyzing" : "active"} size={44} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-zinc-100">Ari</span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wide ${isProcessing ? "text-violet-300" : "text-cyan-300"}`}
              >
                {isProcessing ? "Analyzing" : "Active"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 truncate">
              {isProcessing ? "Reading your response..." : "AI Systems Interviewer"}
            </p>
          </div>
        </div>
      </div>

      {/* Current focus + signal */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-4 space-y-3">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          Interview Signal
        </div>

        {currentTopic && (
          <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.04] px-3 py-2.5">
            <div className="text-[10px] text-zinc-600 font-mono">Current Area</div>
            <div className="text-sm font-medium text-indigo-300">{currentTopic}</div>
          </div>
        )}

        {adaptiveLabel && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wide">{adaptiveLabel}</span>
          </div>
        )}

        {/* Requirement meters */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Meter label="Questions" value={turnCount} target={8} met={questionsMet} />
          <Meter label="Areas" value={coveredCurriculumDaysCount} target={4} met={areasMet} />
        </div>
      </div>

      {/* Explored areas with signal spine */}
      {coveredTopics.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-4">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-3">
            Explored Areas ({coveredTopics.length})
          </div>
          <div className="relative space-y-2.5 max-h-40 overflow-y-auto pr-1">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-emerald-500/40 to-transparent" />
            {coveredTopics.map((topic, idx) => (
              <div key={idx} className="relative flex items-center gap-2.5 pl-1">
                <span className="relative z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-emerald-500/50">
                  <Check className="h-1.5 w-1.5 text-emerald-400" strokeWidth={4} />
                </span>
                <span className="text-[11px] text-zinc-400 truncate">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Meter({ label, value, target, met }: { label: string; value: number; target: number; met: boolean }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] text-zinc-600 font-mono">{label}</span>
        <span className={`text-xs font-bold font-mono ${met ? "text-emerald-400" : "text-zinc-300"}`}>{value}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="bar-fill h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: met ? "#34d399" : "linear-gradient(90deg,#6366f1,#22d3ee)",
          }}
        />
      </div>
      <div className="mt-1 text-[9px] text-zinc-700 font-mono">min {target}</div>
    </div>
  );
}
