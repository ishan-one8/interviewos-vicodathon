"use client";

import React from "react";
import { CheckCircle2, Layers, Compass } from "lucide-react";

interface InterviewProgressProps {
  turnCount: number;
  coveredCurriculumDaysCount: number;
  coveredTopics: string[];
}

export function InterviewProgress({
  turnCount,
  coveredCurriculumDaysCount,
  coveredTopics,
}: InterviewProgressProps) {
  const minQuestions = 8;
  const progressPercent = Math.min(100, Math.round((turnCount / minQuestions) * 100));

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-indigo-400" />
          Session Progress
        </h3>
        <span className="text-xs font-mono font-semibold text-indigo-400">
          Question {turnCount} of at least {minQuestions}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
          <div className="text-lg font-bold text-zinc-100 font-mono">{turnCount}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Questions Completed</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
          <div className="text-lg font-bold text-zinc-100 font-mono">{coveredCurriculumDaysCount}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Curriculum Areas</div>
        </div>
      </div>

      {/* Explored Topics */}
      {coveredTopics.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-indigo-400" />
            Explored Topics ({coveredTopics.length})
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
            {coveredTopics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-zinc-300 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/40"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
