"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export type AdaptationSummaryData = {
  followUpCount: number;
  deepenCount: number;
  clarifyCount: number;
  challengeCount: number;
  newTopicCount: number;
  topicsExplored: number;
};

interface AdaptationSummaryProps {
  summary: AdaptationSummaryData;
}

export function AdaptationSummary({ summary }: AdaptationSummaryProps) {
  const totalAdaptive = summary.followUpCount + summary.deepenCount + summary.clarifyCount + summary.challengeCount;

  if (totalAdaptive === 0 && summary.newTopicCount === 0) return null;

  const items = [
    { label: "Follow-ups", count: summary.followUpCount, color: "text-indigo-400" },
    { label: "Deeper Probes", count: summary.deepenCount, color: "text-violet-400" },
    { label: "Clarifications", count: summary.clarifyCount, color: "text-amber-400" },
    { label: "Challenges", count: summary.challengeCount, color: "text-rose-400" },
    { label: "New Areas", count: summary.newTopicCount, color: "text-cyan-400" },
  ].filter((item) => item.count > 0);

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <div>
          <h2 className="text-base font-bold text-zinc-100">How InterviewOS Adapted</h2>
          <p className="text-xs text-zinc-400">
            {totalAdaptive} adaptive decisions across {summary.topicsExplored} topics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
            <div className={`text-xl font-bold font-mono ${item.color}`}>{item.count}</div>
            <div className="text-[10px] text-zinc-400 font-medium">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
