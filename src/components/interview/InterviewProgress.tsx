"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

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
  return (
    <div className="w-full space-y-4">
      {/* Session metrics */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          Session Progress
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-center py-2">
            <div className="text-lg font-bold text-zinc-200 font-mono">{turnCount}</div>
            <div className="text-[10px] text-zinc-600">Questions Done</div>
            <div className="text-[10px] text-zinc-700 font-mono">at least 8</div>
          </div>
          <div className="text-center py-2">
            <div className="text-lg font-bold text-zinc-200 font-mono">{coveredCurriculumDaysCount}</div>
            <div className="text-[10px] text-zinc-600">Curriculum Areas</div>
            <div className="text-[10px] text-zinc-700 font-mono">at least 4</div>
          </div>
        </div>

        {/* Current focus */}
        {currentTopic && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
            <div className="text-[11px]">
              <span className="text-zinc-600">Current: </span>
              <span className="text-indigo-400 font-medium">{currentTopic}</span>
            </div>
            {adaptiveAction && (
              <span className="text-[10px] font-mono text-indigo-500/60">{adaptiveAction}</span>
            )}
          </div>
        )}
      </div>

      {/* Explored topics */}
      {coveredTopics.length > 0 && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
            Explored Topics ({coveredTopics.length})
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {coveredTopics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[11px] text-zinc-400 py-1"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="truncate">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
