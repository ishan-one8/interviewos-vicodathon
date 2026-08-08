"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProductShell } from "@/components/ui/ProductShell";
import { SessionLobby } from "@/components/interview/SessionLobby";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { LiveIntelligencePanel } from "@/components/interview/LiveIntelligencePanel";
import { ProcessingState } from "@/components/interview/ProcessingState";
import { InterviewError } from "@/components/interview/InterviewError";
import { CompletionState } from "@/components/interview/CompletionState";
import { AuroraBackground } from "@/components/visual/AuroraBackground";
import { AriCore } from "@/components/visual/AriCore";
import type { InterviewSessionDTO } from "@/types/session-dto";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

type PageState = "loading" | "lobby" | "active" | "completed" | "not_found" | "error";

export default function SessionInterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [session, setSession] = useState<InterviewSessionDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousTopic, setPreviousTopic] = useState<string | null>(null);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/interview/session?id=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        if (res.status === 404) {
          setPageState("not_found");
          return;
        }

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Failed to load session.");
          setPageState("error");
          return;
        }

        setSession(data.session);
        setPageState(data.session.isComplete ? "completed" : "lobby");
      } catch {
        if (!cancelled) {
          setErrorMessage("Failed to connect to the server.");
          setPageState("error");
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  const handleBeginInterview = () => {
    setPageState("active");
  };

  const handleSubmitAnswer = async (answerText: string) => {
    if (!session?.currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setLastSubmittedAnswer(answerText);

    try {
      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: session.currentQuestion.id,
          answer: answerText,
          previousTopic: session.currentQuestion.topic,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process answer.");
      }

      setPreviousTopic(session.currentQuestion.topic);
      setSession(data.session);

      if (data.session.isComplete) {
        setPageState("completed");
      }
    } catch {
      setErrorMessage("We couldn't process that response yet. Your answer is preserved — try submitting again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (pageState === "loading") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AriCore state="ready" size={72} className="mx-auto" />
            <p className="text-[11px] text-zinc-600 font-mono">Loading session</p>
          </div>
        </main>
      </ProductShell>
    );
  }

  // Not found
  if (pageState === "not_found") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm text-center space-y-5">
            <div className="mx-auto h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-100">Session Not Found</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                This interview session doesn&apos;t exist or has expired.
              </p>
            </div>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              New Interview
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  // Error (no session loaded)
  if (pageState === "error" && !session) {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-16 space-y-6">
          <InterviewError message={errorMessage || "An unexpected error occurred."} />
          <div className="text-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  if (!session) return null;

  // Lobby
  if (pageState === "lobby") {
    return (
      <ProductShell activeRoute="interview">
        <main className="relative flex-1 flex flex-col justify-center px-4 py-8 overflow-hidden">
          <AuroraBackground variant="subtle" grid />
          <div className="relative w-full">
            <SessionLobby
              candidateName={session.candidateName}
              candidateRole={session.candidateRole}
              onBegin={handleBeginInterview}
              isStarting={false}
            />
          </div>
        </main>
      </ProductShell>
    );
  }

  // Completed
  if (pageState === "completed") {
    return (
      <ProductShell activeRoute="interview">
        <main className="relative flex-1 flex flex-col justify-center px-4 py-8 overflow-hidden">
          <AuroraBackground variant="subtle" grid />
          <div className="relative w-full">
            <CompletionState
              sessionId={sessionId}
              turnCount={session.questionsAnswered}
              coveredCurriculumDaysCount={session.coveredCurriculumDaysCount}
            />
          </div>
        </main>
      </ProductShell>
    );
  }

  // Active interview — console layout
  const topicChanged = Boolean(
    previousTopic && session.currentQuestion && previousTopic !== session.currentQuestion.topic
  );

  return (
    <ProductShell activeRoute="interview">
      <main className="relative flex-1 w-full overflow-hidden">
        <AuroraBackground variant="panel" grid />
        <div className="relative max-w-6xl mx-auto w-full px-4 md:px-8 py-6 space-y-5">
          {/* Top bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <Link
              href="/demo"
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              <ArrowLeft className="h-3 w-3" />
              Exit
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-700">
                Q{session.turnCount}
              </span>
              <span className="text-[10px] font-mono text-zinc-700">&middot;</span>
              <span className="text-[10px] font-mono text-emerald-600">Active</span>
            </div>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <InterviewError
              message={errorMessage}
              onRetry={() => lastSubmittedAnswer && handleSubmitAnswer(lastSubmittedAnswer)}
            />
          )}

          {/* Main layout: content + sidebar */}
          {session.currentQuestion && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
              {/* Main interview area */}
              <div className="space-y-6 min-w-0">
                <QuestionCard
                  key={session.currentQuestion.id}
                  question={session.currentQuestion}
                  questionNumber={session.turnCount}
                  topicChanged={topicChanged}
                  adaptiveAction={session.adaptiveContext?.action}
                  adaptiveLabel={session.adaptiveContext?.label}
                  safeReason={session.adaptiveContext?.safeReason}
                />

                {isSubmitting ? (
                  <ProcessingState />
                ) : (
                  <AnswerComposer
                    onSubmitAnswer={handleSubmitAnswer}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>

              {/* Live intelligence panel (rendered right on desktop) */}
              <aside className="hidden lg:block">
                <LiveIntelligencePanel
                  turnCount={session.questionsAnswered}
                  coveredCurriculumDaysCount={session.coveredCurriculumDaysCount}
                  coveredTopics={session.coveredTopics}
                  currentTopic={session.currentQuestion.topic}
                  adaptiveLabel={session.adaptiveContext?.label}
                  isProcessing={isSubmitting}
                />
              </aside>

              {/* Mobile panel (below answer composer) */}
              <div className="lg:hidden">
                <LiveIntelligencePanel
                  turnCount={session.questionsAnswered}
                  coveredCurriculumDaysCount={session.coveredCurriculumDaysCount}
                  coveredTopics={session.coveredTopics}
                  currentTopic={session.currentQuestion.topic}
                  adaptiveLabel={session.adaptiveContext?.label}
                  isProcessing={isSubmitting}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </ProductShell>
  );
}
