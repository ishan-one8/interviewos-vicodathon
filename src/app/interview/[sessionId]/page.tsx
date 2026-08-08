"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProductShell } from "@/components/ui/ProductShell";
import { SessionLobby } from "@/components/interview/SessionLobby";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { InterviewProgress } from "@/components/interview/InterviewProgress";
import { ProcessingState } from "@/components/interview/ProcessingState";
import { InterviewError } from "@/components/interview/InterviewError";
import { CompletionState } from "@/components/interview/CompletionState";
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

  // Loading state
  if (pageState === "loading") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-zinc-400 font-mono">Loading session...</p>
          </div>
        </main>
      </ProductShell>
    );
  }

  // Not found state
  if (pageState === "not_found") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-100">Session Not Found</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                This interview session doesn&apos;t exist or has expired. Sessions are held in memory and may be lost on server restart.
              </p>
            </div>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Start New Interview</span>
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  // Error state
  if (pageState === "error" && !session) {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-16 space-y-6">
          <InterviewError message={errorMessage || "An unexpected error occurred."} />
          <div className="text-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Demo</span>
            </Link>
          </div>
        </main>
      </ProductShell>
    );
  }

  if (!session) return null;

  // Lobby state
  if (pageState === "lobby") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex flex-col justify-center px-4 py-8">
          <SessionLobby
            candidateName={session.candidateName}
            candidateRole={session.candidateRole}
            onBegin={handleBeginInterview}
            isStarting={false}
          />
        </main>
      </ProductShell>
    );
  }

  // Completed state
  if (pageState === "completed") {
    return (
      <ProductShell activeRoute="interview">
        <main className="flex-1 flex flex-col justify-center px-4 py-8">
          <CompletionState
            sessionId={sessionId}
            turnCount={session.questionsAnswered}
            coveredCurriculumDaysCount={session.coveredCurriculumDaysCount}
          />
        </main>
      </ProductShell>
    );
  }

  // Active interview state
  const topicChanged = Boolean(
    previousTopic && session.currentQuestion && previousTopic !== session.currentQuestion.topic
  );

  return (
    <ProductShell activeRoute="interview">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col justify-center">
        <div className="w-full space-y-6">
          {/* Top Session Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <Link
              href="/demo"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit Session
            </Link>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-zinc-400">Session:</span>
              <span className="text-indigo-400 font-semibold">{sessionId.slice(0, 18)}...</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <InterviewError
              message={errorMessage}
              onRetry={() => lastSubmittedAnswer && handleSubmitAnswer(lastSubmittedAnswer)}
            />
          )}

          {/* Main Layout Grid */}
          {session.currentQuestion && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6">
                <QuestionCard
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

              <div className="lg:col-span-1">
                <InterviewProgress
                  turnCount={session.questionsAnswered}
                  coveredCurriculumDaysCount={session.coveredCurriculumDaysCount}
                  coveredTopics={session.coveredTopics}
                  currentTopic={session.currentQuestion.topic}
                  adaptiveAction={session.adaptiveContext?.label}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </ProductShell>
  );
}
