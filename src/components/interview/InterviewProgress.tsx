"use client";

import React from "react";
import { CheckCircle2, Layers, Compass, Sparkles } from "lucide-react";

interface InterviewProgressProps {
  turnCount: number;
  coveredCurriculumDaysCount: number;
  coveredTopics: string[];
  currentTopic?: string;
  adaptiveAction?: string;
}

export function InterviewProgress({
  turnCount,
  coveredCurriculumDaysCount,
  coveredTopics,
  currentTopic,
  adaptiveAction,
}: InterviewProgressProps) {
  const minQuestions = 8;

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-indigo-400" />
          Session Progress
        </h3>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
          <div className="text-lg font-bold text-zinc-100 font-mono">{turnCount}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Questions Done</div>
          <div className="text-[10px] text-zinc-500 font-mono">at least {minQuestions}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
          <div className="text-lg font-bold text-zinc-100 font-mono">{coveredCurriculumDaysCount}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Curriculum Areas</div>
          <div className="text-[10px] text-zinc-500 font-mono">at least 4</div>
        </div>
      </div>

      {/* Current Focus */}
      {currentTopic && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <span className="text-zinc-400">Current: </span>
            <span className="text-indigo-300 font-medium">{currentTopic}</span>
          </div>
          {adaptiveAction && (
            <span className="ml-auto text-[10px] font-mono text-indigo-400/70">{adaptiveAction}</span>
          )}
        </div>
      )}

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
