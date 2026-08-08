"use client";

import React from "react";
import { OfficialQuestion } from "@/lib/api/contract";
import { InterviewerIdentity } from "./InterviewerIdentity";
import { AdaptiveLabel } from "./AdaptiveLabel";
import { WhyThisQuestion } from "./WhyThisQuestion";
import { Compass, Layers } from "lucide-react";

interface QuestionCardProps {
  question: OfficialQuestion;
  questionNumber: number;
  topicChanged?: boolean;
  adaptiveAction?: string;
  adaptiveLabel?: string;
  safeReason?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  topicChanged = false,
  adaptiveAction,
  adaptiveLabel: adaptiveLabelText,
  safeReason,
}: QuestionCardProps) {
  const difficultyLabel =
    question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);

  return (
    <div className="w-full bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-6 space-y-5 shadow-xl shadow-black/40 relative overflow-hidden transition-all">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-4">
        <InterviewerIdentity size="sm" statusText="Active Question" />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Adaptive Label */}
          {adaptiveAction && adaptiveLabelText && (
            <AdaptiveLabel action={adaptiveAction} label={adaptiveLabelText} />
          )}

          {/* Safe Metadata Tags */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-[11px] font-mono">
            <Compass className="h-3 w-3 text-zinc-400" />
            {question.topic}
          </span>

          <span className="px-2.5 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 text-[11px] font-mono capitalize">
            {difficultyLabel}
          </span>
        </div>
      </div>

      {/* Topic Transition */}
      {topicChanged && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
          <Layers className="h-3.5 w-3.5" />
          <span>Transitioning topic focus to: {question.topic}</span>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
          Question {questionNumber}
        </div>
        <p className="text-zinc-100 text-base md:text-lg font-medium leading-relaxed tracking-tight">
          {question.text}
        </p>
      </div>

      {/* Why This Question */}
      {safeReason && <WhyThisQuestion safeReason={safeReason} />}
    </div>
  );
}
