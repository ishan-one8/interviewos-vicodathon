"use client";

import React, { useState } from "react";
import { ReplayTurnItem } from "@/lib/report/dto-builder";
import { ChevronDown, CheckCircle2, ShieldAlert } from "lucide-react";
import { useInView } from "@/components/visual/useInView";

interface InterviewReplayProps {
  replayTimeline: ReplayTurnItem[];
}

export function InterviewReplay({ replayTimeline }: InterviewReplayProps) {
  const [ref, inView] = useInView<HTMLDivElement>(0.05);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });

  const toggle = (turn: number) => setExpanded((p) => ({ ...p, [turn]: !p[turn] }));

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Interview Replay</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Click any turn to trace the adaptive decision</p>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">{replayTimeline.length} turns</span>
      </div>

      <div ref={ref} className="relative ml-3 md:ml-4 pl-5 md:pl-6 space-y-5">
        {/* Glowing spine */}
        <div className="absolute left-0 top-1 bottom-1 w-px overflow-hidden">
          <div
            className="h-full w-full origin-top"
            style={{
              background: "linear-gradient(to bottom, #6366f1, #22d3ee, #a78bfa, transparent)",
              boxShadow: "0 0 8px rgba(99,102,241,0.5)",
              transform: inView ? "scaleY(1)" : "scaleY(0)",
              transition: "transform 1.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>

        {replayTimeline.map((item) => {
          const isOpen = !!expanded[item.turnNumber];
          return (
            <div key={item.questionId} className="relative">
              {/* Node */}
              <div
                className="absolute -left-[23px] md:-left-[27px] top-1 h-5 w-5 rounded-full bg-[var(--surface)] border-2 flex items-center justify-center font-mono text-[9px] font-bold text-indigo-300 transition-all duration-300"
                style={{
                  borderColor: isOpen ? "#22d3ee" : "rgba(99,102,241,0.55)",
                  boxShadow: isOpen ? "0 0 12px rgba(34,211,238,0.6)" : "0 0 8px rgba(99,102,241,0.35)",
                }}
              >
                {item.turnNumber}
              </div>

              <div className="rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] overflow-hidden">
                {/* Header (clickable) */}
                <button
                  type="button"
                  onClick={() => toggle(item.turnNumber)}
                  className="w-full text-left p-4 space-y-2.5 hover:bg-white/[0.015] transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="text-indigo-400 font-medium">Q{item.turnNumber}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{item.topic}</span>
                      {item.isFollowUp && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/8 border border-indigo-500/20 text-indigo-400 text-[9px]">Follow-up</span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50 text-[9px] capitalize">{item.difficulty}</span>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{item.questionText}</p>
                  {/* decision label always visible */}
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-indigo-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" style={{ boxShadow: "0 0 6px #818cf8" }} />
                    {item.decisionTrace.label}
                  </div>
                </button>

                {/* Expandable details */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 animate-fade-in">
                    {/* Response */}
                    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3">
                      <div className="text-[10px] font-mono text-zinc-600 mb-1">Candidate Response</div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.candidateAnswer}</p>
                    </div>

                    {/* Decision */}
                    <div className="rounded-lg bg-indigo-500/[0.05] border border-indigo-500/15 p-3 text-[11px]">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-indigo-300 font-medium">Adaptive Decision · {item.decisionTrace.label}</span>
                        <span className="text-[10px] text-zinc-600 uppercase">{item.decisionTrace.action}</span>
                      </div>
                      <p className="text-zinc-400 mt-1 leading-relaxed">{item.decisionTrace.description}</p>
                    </div>

                    {/* Contradiction */}
                    {item.contradictionEvent && (
                      <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/15 p-3 text-[11px]">
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium font-mono">
                          <ShieldAlert className="h-3 w-3" />
                          Clarification Moment
                        </div>
                        <p className="text-zinc-400 mt-1">{item.contradictionEvent.explanation}</p>
                      </div>
                    )}

                    {/* Evidence */}
                    {item.evidenceGenerated.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono text-zinc-600">Evidence ({item.evidenceGenerated.length})</div>
                        {item.evidenceGenerated.map((ev) => (
                          <div key={ev.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border-subtle)] text-[11px]">
                            <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                                <span className="text-indigo-400">{ev.competency}</span>
                                <span>·</span>
                                <span>{ev.id}</span>
                              </div>
                              <p className="text-zinc-300">{ev.observation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
