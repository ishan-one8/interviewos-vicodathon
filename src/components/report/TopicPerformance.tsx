"use client";

import React from "react";
import { TopicResult } from "@/types/interview";

interface TopicPerformanceProps {
  topicResults: TopicResult[];
}

export function TopicPerformance({ topicResults }: TopicPerformanceProps) {
  const testedTopics = topicResults.filter((t) => t.status === "assessed");

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base font-bold text-zinc-200">Topics Explored</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Performance across topics actively assessed
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">
          {testedTopics.length} assessed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {testedTopics.map((item, idx) => {
          const normScore = item.normalizedScore ?? 75;
          const isStrong = normScore >= 80;
          const isCompetent = normScore >= 60;
          const statusText = isStrong ? "Strong" : isCompetent ? "Competent" : "Developing";

          return (
            <div
              key={idx}
              className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border-subtle)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-zinc-200">{item.topic}</h3>
                  <div className="text-[10px] font-mono text-zinc-600">
                    Days: {item.curriculumDays.join(", ")} · {item.evidenceIds.length} evidence
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 border ${
                    isStrong
                      ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
                      : isCompetent
                      ? "bg-indigo-500/8 text-indigo-400 border-indigo-500/20"
                      : "bg-amber-500/8 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {statusText}
                </span>
              </div>

              {item.strengths.length > 0 && (
                <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-[var(--border-subtle)] pt-2">
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
