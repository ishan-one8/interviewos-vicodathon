"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductShell } from "@/components/ui/ProductShell";
import { ReportHeader } from "@/components/report/ReportHeader";
import { CompetencyBreakdown } from "@/components/report/CompetencyBreakdown";
import { TopicPerformance } from "@/components/report/TopicPerformance";
import { StrengthsAndGaps } from "@/components/report/StrengthsAndGaps";
import { InterviewReplay } from "@/components/report/InterviewReplay";
import { ReportSkeleton } from "@/components/report/ReportSkeleton";
import { InterviewError } from "@/components/interview/InterviewError";
import { CandidateReportDTO } from "@/lib/report/dto-builder";
import { AdaptationSummary } from "@/components/report/AdaptationSummary";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

function ReportContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;
  const candidateId = searchParams.get("candidateId") || "CAND-003";
  const scenario = searchParams.get("scenario") || undefined;
  const isJudgeMode = searchParams.get("view") === "judge";

  const [dto, setDto] = useState<CandidateReportDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "competencies" | "topics" | "strengths" | "replay">("overview");

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (sessionId) query.set("sessionId", sessionId);
        if (candidateId) query.set("candidateId", candidateId);
        if (scenario) query.set("scenario", scenario);

        const res = await fetch(`/api/interview/report?${query.toString()}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Failed to load report data.");
        }

        setDto(result.data);
      } catch {
        setError("We couldn't retrieve the interview report. Please verify session details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [sessionId, candidateId, scenario]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <ProductShell activeRoute="about">
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
          <ReportSkeleton />
        </main>
      </ProductShell>
    );
  }

  if (error || !dto) {
    return (
      <ProductShell activeRoute="about">
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-16 space-y-6">
          <InterviewError message={error || "Report unavailable."} />
          <div className="text-center">
            <Link
              href="/demo"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Interview Lobby</span>
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  const { report, scoreExplanations, replayTimeline, judgeTraceSummary, adaptationSummary } = dto;

  return (
    <ProductShell activeRoute="about">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 space-y-8 print:p-0 print:m-0">
        {/* Navigation & Controls Row (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 print:hidden">
          <Link
            href="/demo"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Lobby
          </Link>

          {/* Section Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "overview" ? "bg-indigo-600 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("competencies")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "competencies" ? "bg-indigo-600 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Competencies
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("topics")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "topics" ? "bg-indigo-600 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Topics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("strengths")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "strengths" ? "bg-indigo-600 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Strengths & Gaps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("replay")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "replay" ? "bg-indigo-600 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Interview Replay
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isJudgeMode && (
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-semibold">
                JUDGE DEMO MODE
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* 1. Header & Primary Summary Card */}
        <ReportHeader report={report} judgeTraceSummary={judgeTraceSummary} />

        {/* 2. Feedback Summary Box (Section 4) */}
        {report.feedback && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-3 shadow-xl">
            <div className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
              Executive Evaluation Summary
            </div>
            <p className="text-zinc-100 text-sm md:text-base leading-relaxed font-medium">
              {report.feedback.summary}
            </p>
          </div>
        )}

        {/* Adaptation Summary */}
        {(activeTab === "overview") && adaptationSummary && (
          <AdaptationSummary summary={adaptationSummary} />
        )}

        {/* 3. Main Report Content Sections */}
        {(activeTab === "overview" || activeTab === "competencies") && (
          <CompetencyBreakdown
            competencies={report.competencies}
            scoreExplanations={scoreExplanations}
          />
        )}

        {(activeTab === "overview" || activeTab === "topics") && (
          <TopicPerformance topicResults={report.topicResults} />
        )}

        {(activeTab === "overview" || activeTab === "strengths") && (
          <StrengthsAndGaps
            strengths={report.strengths}
            developmentAreas={report.developmentAreas}
            nextSteps={report.feedback.nextSteps}
          />
        )}

        {(activeTab === "overview" || activeTab === "replay") && (
          <InterviewReplay replayTimeline={replayTimeline} />
        )}
      </main>
    </ProductShell>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportContent />
    </Suspense>
  );
}
