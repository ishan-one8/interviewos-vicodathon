"use client";

import React from "react";
import { TopicResult } from "@/types/interview";
import { Compass } from "lucide-react";

interface TopicPerformanceProps {
  topicResults: TopicResult[];
}

export function TopicPerformance({ topicResults }: TopicPerformanceProps) {
  const testedTopics = topicResults.filter((t) => t.status === "assessed");

  return (
    <div className="w-full bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Topics Explored</h2>
          <p className="text-xs text-zinc-400">
            Performance evaluated across topics actively tested during the interview session.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-semibold">
          {testedTopics.length} Topics Assessed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testedTopics.map((item, idx) => {
          const normScore = item.normalizedScore ?? 75;
          const isStrong = normScore >= 80;
          const isCompetent = normScore >= 60;
          const statusText = isStrong ? "Strong" : isCompetent ? "Competent" : "Developing";

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
                    <h3 className="font-semibold text-sm text-zinc-100">{item.topic}</h3>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Days: {item.curriculumDays.join(", ")} • {item.evidenceIds.length} evidence links
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-semibold shrink-0 border ${
                    isStrong
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : isCompetent
                      ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {statusText}
                </span>
              </div>

              {item.strengths.length > 0 && (
                <p className="text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60 pt-2 font-medium">
                  {item.strengths[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
