"use client";

import React, { useState } from "react";
import { ReplayTurnItem } from "@/lib/report/dto-builder";
import { Sparkles, ChevronDown, ChevronUp, Layers, CheckCircle2, GitCommit, ShieldAlert } from "lucide-react";

interface InterviewReplayProps {
  replayTimeline: ReplayTurnItem[];
}

export function InterviewReplay({ replayTimeline }: InterviewReplayProps) {
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (turnNum: number) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [turnNum]: !prev[turnNum],
    }));
  };

  return (
    <div className="w-full bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 font-semibold mb-1">
            <GitCommit className="h-4 w-4" />
            QUESTION-BY-QUESTION INTERVIEW REPLAY
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Adaptive Interview Timeline</h2>
          <p className="text-xs text-zinc-400">
            Visually audit every question, candidate response, decision trace, and generated evidence.
          </p>
        </div>

        <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
          {replayTimeline.length} Turns Completed
        </span>
      </div>

      {/* Timeline Items */}
      <div className="relative border-l-2 border-zinc-800 ml-3 md:ml-6 pl-6 md:pl-8 space-y-10">
        {replayTimeline.map((item) => {
          const isAnswerExpanded = expandedAnswers[item.turnNumber];
          const isLongAnswer = item.candidateAnswer.length > 200;
          const displayAnswer =
            isLongAnswer && !isAnswerExpanded
              ? `${item.candidateAnswer.slice(0, 200)}...`
              : item.candidateAnswer;

          return (
            <div key={item.questionId} className="relative space-y-4 group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-[31px] md:-left-[39px] top-1.5 h-6 w-6 rounded-full bg-zinc-900 border-2 border-indigo-500 text-indigo-400 flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                {item.turnNumber}
              </div>

              {/* Question Header Card */}
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">Q{item.turnNumber}</span>
                    <span className="text-xs font-semibold text-zinc-200">{item.topic}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Day {item.curriculumDay}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Follow-up Indicator */}
                    {item.isFollowUp && (
                      <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        FOLLOW-UP
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 font-mono text-[10px] capitalize">
                      {item.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                  {item.questionText}
                </p>
              </div>

              {/* Candidate Answer Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="font-semibold text-zinc-300">Candidate Response</span>
                  <span>{item.candidateAnswer.length} chars</span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {displayAnswer}
                </p>

                {isLongAnswer && (
                  <button
                    type="button"
                    onClick={() => toggleAnswer(item.turnNumber)}
                    className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none pt-1"
                  >
                    <span>{isAnswerExpanded ? "Collapse response" : "Show full response"}</span>
                    {isAnswerExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {/* System Adaptive Decision Trace (Section 14) */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
                    <Layers className="h-3.5 w-3.5" />
                    <span>SYSTEM DECISION TRACE: {item.decisionTrace.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">{item.decisionTrace.action}</span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {item.decisionTrace.description}
                </p>
              </div>

              {/* Contradiction / Refinement Moment (Section 16, 17) */}
              {item.contradictionEvent && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-amber-400 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      CLARIFICATION MOMENT
                    </span>
                    <span className="uppercase text-[10px]">{item.contradictionEvent.status}</span>
                  </div>
                  <p className="text-zinc-300 text-xs font-sans">{item.contradictionEvent.explanation}</p>
                </div>
              )}

              {/* Evidence Generated Trace (Section 18) */}
              {item.evidenceGenerated.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">
                    Evidence Recorded ({item.evidenceGenerated.length})
                  </div>
                  <div className="space-y-1.5">
                    {item.evidenceGenerated.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                            <span className="font-semibold text-indigo-300">{ev.competency}</span>
                            <span>•</span>
                            <span>{ev.id}</span>
                          </div>
                          <p className="text-zinc-200">{ev.observation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
