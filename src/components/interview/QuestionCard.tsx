"use client";

import React from "react";
import { OfficialQuestion } from "@/lib/api/contract";
import { AdaptiveLabel } from "./AdaptiveLabel";
import { WhyThisQuestion } from "./WhyThisQuestion";

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
    <div className="relative q-light q-enter space-y-5">
      {/* Topic transition */}
      {topicChanged && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
          <div className="h-px flex-1 bg-cyan-500/20" />
          <span>New area: {question.topic}</span>
          <div className="h-px flex-1 bg-cyan-500/20" />
        </div>
      )}

      {/* Metadata: strong adaptive badge + context */}
      <div className="flex flex-wrap items-center gap-3">
        {adaptiveAction && adaptiveLabelText && (
          <span className="relative overflow-hidden rounded-md badge-sweep">
            <AdaptiveLabel action={adaptiveAction} label={adaptiveLabelText} />
          </span>
        )}
        <span className="text-[10px] font-mono text-zinc-500">{question.topic}</span>
        <span className="text-[10px] font-mono text-zinc-700">&middot;</span>
        <span className="text-[10px] font-mono text-zinc-500 capitalize">{difficultyLabel}</span>
      </div>

      {/* Question — editorial */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Question {questionNumber}
        </div>
        <p className="text-zinc-50 text-xl md:text-[1.7rem] font-semibold leading-[1.3] tracking-tight max-w-2xl">
          {question.text}
        </p>
      </div>

      {/* Why this question */}
      {safeReason && <WhyThisQuestion safeReason={safeReason} />}
    </div>
  );
}
