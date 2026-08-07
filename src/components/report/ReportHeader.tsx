"use client";

import React from "react";
import { InterviewReport } from "@/types/interview";
import { Award, CheckCircle2, ShieldCheck, Calendar } from "lucide-react";

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

  // Confidence explanation
  const confidencePercent = Math.round(report.overall.confidence * 100);
  const confidenceLabel =
    report.overall.confidence >= 0.8
      ? "High Confidence"
      : report.overall.confidence >= 0.5
      ? "Moderate Confidence"
      : "Low Confidence";

  const confidenceExplanation = `Based on ${report.completion.questionsAnswered} questions across ${report.completion.curriculumDaysCovered.length} curriculum areas.`;

  return (
    <div className="w-full bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl shadow-black/50 relative overflow-hidden">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>InterviewOS • Technical Evaluation Report</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {isProvisional ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
              PROVISIONAL REPORT
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              VERIFIED FINAL REPORT
            </span>
          )}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Candidate Info */}
        <div className="lg:col-span-2 space-y-2">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold">
            Candidate Evaluation
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">
            {report.candidateName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono pt-1">
            <span>ID: {report.candidateId}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              {new Date(report.generatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Primary Result Score Card */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3 shadow-inner">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
            Overall Demonstrated Score
          </div>

          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold font-mono text-zinc-100 tracking-tight">
              {report.overall.score}
            </span>
            <span className="text-xl font-mono text-zinc-400">/100</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs uppercase tracking-wider">
              Level: {report.overall.level.replace("_", " ")}
            </span>
          </div>

          {/* Section 3: Confidence UX with explanation */}
          <div className="pt-2 border-t border-zinc-800/80 text-left space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-indigo-400" />
                Confidence:
              </span>
              <span className="text-zinc-200 font-semibold">{confidenceLabel} ({confidencePercent}%)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {confidenceExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Completion & Judge Coverage Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/60 text-xs font-mono">
        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
          <div className="text-zinc-400 text-[10px]">Questions Answered</div>
          <div className="text-base font-bold text-zinc-100">{report.completion.questionsAnswered}</div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
          <div className="text-zinc-400 text-[10px]">Curriculum Days</div>
          <div className="text-base font-bold text-zinc-100">{report.completion.curriculumDaysCovered.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
          <div className="text-zinc-400 text-[10px]">Topics Assessed</div>
          <div className="text-base font-bold text-zinc-100">{report.topicResults.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
          <div className="text-zinc-400 text-[10px]">Adaptive Events</div>
          <div className="text-base font-bold text-indigo-400">{judgeTraceSummary?.adaptiveEventsCount || 0}</div>
        </div>
      </div>
    </div>
  );
}
