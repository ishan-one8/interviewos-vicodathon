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
import { AuroraBackground } from "@/components/visual/AuroraBackground";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

function ReportContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;
  const candidateId = searchParams.get("candidateId") || "CAND-003";
  const scenario = searchParams.get("scenario") || undefined;

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
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
          <ReportSkeleton />
        </main>
      </ProductShell>
    );
  }

  if (error || !dto) {
    return (
      <ProductShell activeRoute="about">
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-16 space-y-6">
          <InterviewError message={error || "Report unavailable."} />
          <div className="text-center">
            <Link
              href="/demo"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  const { report, scoreExplanations, replayTimeline, judgeTraceSummary, adaptationSummary } = dto;

  const adaptationPath = replayTimeline.map((t) => ({
    label: t.decisionTrace.label,
    action: t.decisionTrace.action,
  }));

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "competencies" as const, label: "Competencies" },
    { key: "topics" as const, label: "Topics" },
    { key: "strengths" as const, label: "Strengths & Gaps" },
    { key: "replay" as const, label: "Replay" },
  ];

  return (
    <ProductShell activeRoute="about">
      <main className="relative flex-1 w-full print:p-0 print:m-0">
        <AuroraBackground variant="subtle" grid={false} className="print:hidden" />
        <div className="relative max-w-5xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)] print:hidden">
          <Link
            href="/demo"
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <ArrowLeft className="h-3 w-3" />
            Return
          </Link>

          {/* Tab navigation */}
          <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-zinc-700 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors focus:outline-none"
          >
            <Printer className="h-3 w-3" />
            Print
          </button>
        </div>

        {/* Report header */}
        <ReportHeader report={report} judgeTraceSummary={judgeTraceSummary} />

        {/* Feedback summary */}
        {report.feedback && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-6 space-y-2">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              Evaluation Summary
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {report.feedback.summary}
            </p>
          </div>
        )}

        {/* Adaptation Summary */}
        {(activeTab === "overview") && adaptationSummary && (
          <AdaptationSummary summary={adaptationSummary} path={adaptationPath} />
        )}

        {/* Content sections */}
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
        </div>
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
