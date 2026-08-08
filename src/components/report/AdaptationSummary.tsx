"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export type AdaptationSummaryData = {
  followUpCount: number;
  deepenCount: number;
  clarifyCount: number;
  challengeCount: number;
  newTopicCount: number;
  topicsExplored: number;
};

export type AdaptationStep = { label: string; action: string };

interface AdaptationSummaryProps {
  summary: AdaptationSummaryData;
  path?: AdaptationStep[];
}

const ACTION_DOT: Record<string, string> = {
  personalized_start: "#22d3ee",
  new_topic: "#22d3ee",
  follow_up: "#818cf8",
  deepen: "#a78bfa",
  clarify: "#fbbf24",
  challenge: "#fb7185",
};

export function AdaptationSummary({ summary, path = [] }: AdaptationSummaryProps) {
  const totalAdaptive =
    summary.followUpCount + summary.deepenCount + summary.clarifyCount + summary.challengeCount;

  if (totalAdaptive === 0 && summary.newTopicCount === 0) return null;

  const counts = [
    { label: "Follow-ups", count: summary.followUpCount, color: "text-indigo-400", dot: "#818cf8" },
    { label: "Deeper Probes", count: summary.deepenCount, color: "text-violet-400", dot: "#a78bfa" },
    { label: "Clarifications", count: summary.clarifyCount, color: "text-amber-400", dot: "#fbbf24" },
    { label: "Challenges", count: summary.challengeCount, color: "text-rose-400", dot: "#fb7185" },
    { label: "New Areas", count: summary.newTopicCount, color: "text-cyan-400", dot: "#22d3ee" },
  ].filter((c) => c.count > 0);

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-6">
      <div className="pb-4 border-b border-[var(--border)]">
        <h2 className="text-base font-bold text-zinc-100">How InterviewOS Adapted</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {totalAdaptive} adaptive decisions across {summary.topicsExplored} topics
        </p>
      </div>

      {/* Adaptive path taken */}
      {path.length > 0 && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] p-4">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-3">
            Path Taken
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {path.map((step, i) => {
              const dot = ACTION_DOT[step.action] || "#818cf8";
              return (
                <React.Fragment key={i}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
                    <span className="text-[10px] font-mono text-zinc-300 whitespace-nowrap">{step.label}</span>
                  </span>
                  {i < path.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-700 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {counts.map((c) => (
          <div key={c.label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-3 text-center">
            <div className={`text-2xl font-bold font-mono ${c.color}`}>{c.count}</div>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-zinc-500">
              <span className="h-1 w-1 rounded-full" style={{ background: c.dot }} />
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
