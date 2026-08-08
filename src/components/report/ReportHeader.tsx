"use client";

import React from "react";
import { InterviewReport } from "@/types/interview";
import { ScoreArc } from "@/components/visual/ScoreArc";
import { MotionNumber } from "@/components/visual/MotionNumber";
import { CheckCircle2, Calendar } from "lucide-react";

interface ReportHeaderProps {
  report: InterviewReport;
  judgeTraceSummary?: {
    totalQuestions: number;
    curriculumDaysCovered: number;
    topicsExploredCount: number;
    minimumRequirementsSatisfied: boolean;
    adaptiveEventsCount: number;
  };
}

export function ReportHeader({ report, judgeTraceSummary }: ReportHeaderProps) {
  const isProvisional = report.reportStatus === "provisional";

  const confidencePercent = Math.round(report.overall.confidence * 100);
  const confidenceLabel =
    report.overall.confidence >= 0.8
      ? "High"
      : report.overall.confidence >= 0.5
      ? "Moderate"
      : "Low";

  const stats = [
    { label: "Questions", value: report.completion.questionsAnswered, accent: "text-zinc-100" },
    { label: "Curriculum Days", value: report.completion.curriculumDaysCovered.length, accent: "text-zinc-100" },
    { label: "Topics", value: report.topicResults.length, accent: "text-zinc-100" },
    { label: "Adaptive Events", value: judgeTraceSummary?.adaptiveEventsCount || 0, accent: "text-indigo-400" },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 md:p-8">
      {/* soft top glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)", filter: "blur(30px)" }}
      />

      <div className="relative">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--border)]">
          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            Interview Complete
          </div>
          {isProvisional ? (
            <span className="px-2.5 py-1 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
              Provisional
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Final Report
            </span>
          )}
        </div>

        {/* Score climax */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center py-6">
          <div className="space-y-2 order-2 md:order-1">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tight">
              {report.candidateName}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <Calendar className="h-3 w-3" />
              <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-zinc-400 pt-2 max-w-md">
              {confidenceLabel} evidence confidence
              <span className="text-zinc-600"> · {confidencePercent}% across {report.completion.questionsAnswered} answered questions</span>
            </p>
          </div>

          <div className="order-1 md:order-2 mx-auto">
            <ScoreArc
              score={report.overall.score}
              levelLabel={report.overall.level.replace("_", " ")}
              size={190}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[var(--border)]">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-3">
              <div className="text-[10px] text-zinc-600 font-mono">{s.label}</div>
              <MotionNumber value={s.value} className={`text-base font-bold font-mono ${s.accent}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
