"use client";

import React, { useState } from "react";
import { ProductShell } from "@/components/ui/ProductShell";
import { CandidateSelector } from "@/components/interview/CandidateSelector";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { InterviewProgress } from "@/components/interview/InterviewProgress";
import { ProcessingState } from "@/components/interview/ProcessingState";
import { InterviewError } from "@/components/interview/InterviewError";
import { CompletionState } from "@/components/interview/CompletionState";
import { OfficialApiResponse, OfficialQuestion, CandidateProfile } from "@/types/interview";
import { getCandidates } from "@/lib/data";
import { ArrowLeft } from "lucide-react";

export default function InterviewPage() {
  const [candidates] = useState<CandidateProfile[]>(() => {
    try {
      return getCandidates().candidates;
    } catch {
      return [];
    }
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    try {
      const list = getCandidates().candidates;
      return list.find((c) => c.id === "CAND-003")?.id || list[0]?.id || null;
    } catch {
      return null;
    }
  });

  // Handler: Start New Interview Session
  const handleStartInterview = async () => {
    if (!selectedCandidateId || isStarting) return;
    setIsStarting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidateId }),
      });

      const data: OfficialApiResponse = await res.json();

      if (!res.ok || !data.sessionId) {
        throw new Error(data.report?.feedback?.summary || "Failed to initialize interview session.");
      }

      setSessionId(data.sessionId);
      setStatus(data.status);
      setCurrentQuestion(data.question);
      setCoveredTopics(data.coveredTopics);
      setCoveredCurriculumDays(data.coveredCurriculumDays);
      setTurnCount(data.turnCount);
      setPreviousTopic(data.question?.topic || null);
    } catch (err) {
      setErrorMessage("We couldn't start the interview session. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Handler: Submit Answer
  const handleSubmitAnswer = async (answerText: string) => {
    if (!sessionId || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setLastSubmittedAnswer(answerText);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answer: answerText,
        }),
      });

      const data: OfficialApiResponse = await res.json();

      if (!res.ok) {
        throw new Error("Answer processing error");
      }

      setPreviousTopic(currentQuestion.topic);
      setStatus(data.status);
      setCurrentQuestion(data.question);
      setCoveredTopics(data.coveredTopics);
      setCoveredCurriculumDays(data.coveredCurriculumDays);
      setTurnCount(data.turnCount);
    } catch (err) {
      setErrorMessage("We couldn't process that response yet. Your answer is preserved — try submitting again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reset / Return to Lobby
  const handleReturnToLobby = () => {
    setSessionId(null);
    setStatus("lobby");
    setCurrentQuestion(null);
    setTurnCount(0);
    setCoveredTopics([]);
    setCoveredCurriculumDays([]);
    setErrorMessage(null);
  };

  // Check if topic changed from previous turn
  const topicChanged = Boolean(
    previousTopic && currentQuestion && previousTopic !== currentQuestion.topic
  );

  // Check if follow-up
  const isFollowUp = Boolean(
    currentQuestion &&
      (currentQuestion.action === "deepen" ||
        currentQuestion.action === "follow_up" ||
        currentQuestion.action === "probe" ||
        turnCount > 1)
  );

  return (
    <ProductShell activeRoute="interview">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col justify-center">
        {/* Scenario A: Lobby / Candidate Selector View */}
        {status === "lobby" && (
          <CandidateSelector
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={setSelectedCandidateId}
            onStartInterview={handleStartInterview}
            isStarting={isStarting}
          />
        )}

        {/* Scenario B: Active Interview Screen */}
        {status === "active" && currentQuestion && (
          <div className="w-full space-y-6">
            {/* Top Session Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <button
                type="button"
                onClick={handleReturnToLobby}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Exit Session
              </button>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-zinc-400">Session ID:</span>
                <span className="text-indigo-400 font-semibold">{sessionId?.slice(0, 18)}...</span>
              </div>
            </div>

            {/* Error Banner if submission failed */}
            {errorMessage && (
              <InterviewError
                message={errorMessage}
                onRetry={() => lastSubmittedAnswer && handleSubmitAnswer(lastSubmittedAnswer)}
              />
            )}

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Question & Answer Area (Dominant 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={turnCount}
                  isFollowUp={isFollowUp}
                  topicChanged={topicChanged}
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

              {/* Progress & Sidebar Area */}
              <div className="lg:col-span-1">
                <InterviewProgress
                  turnCount={turnCount}
                  coveredCurriculumDaysCount={coveredCurriculumDays.length}
                  coveredTopics={coveredTopics}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scenario C: Completed Screen */}
        {status === "completed" && sessionId && (
          <CompletionState
            sessionId={sessionId}
            turnCount={turnCount}
            coveredCurriculumDaysCount={coveredCurriculumDays.length}
          />
        )}
      </main>
    </ProductShell>
  );
}
