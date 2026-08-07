import { NextRequest, NextResponse } from "next/server";
import { getCandidateIntelligence, getCurriculum } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { planNextQuestion } from "@/lib/interview/planner";
import { buildPlaceholderQuestion } from "@/lib/interview/question-template";
import { addQuestion, submitAnswer, attachAssessment } from "@/lib/interview/transitions";
import { evaluateCandidateAnswer } from "@/lib/ai/answer-evaluator";
import { extractClaimsFromAnswer } from "@/lib/ai/claim-extractor";
import { findComparableClaimPairs, analyzeContradictions } from "@/lib/ai/contradiction-detector";
import { createEmptyMemory, addTurnToMemory } from "@/lib/interview/memory";
import {
  createEmptyLedger,
  addTurnEvidenceToLedger,
  addContradictionEvidenceToLedger,
} from "@/lib/interview/evidence";
import {
  getEvidenceCoverageMatrix,
  getEvidenceGapSignalForPlanner,
  getGapEvidence,
} from "@/lib/interview/evidence-selectors";
import { Result } from "@/lib/interview/errors";

function unwrap<T>(res: Result<T>): T {
  if (!res.ok) throw new Error(`State error: ${res.error.message}`);
  return res.value;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scenario = searchParams.get("scenario") || "mixed";
    const candidateId = searchParams.get("candidateId") || "CAND-003";

    const intelligence = getCandidateIntelligence(candidateId);
    if (!intelligence) {
      return NextResponse.json({ status: "error", error: `Candidate '${candidateId}' not found.` }, { status: 404 });
    }

    const { topics } = getCurriculum();
    let session = createInterviewSession(intelligence.candidate, intelligence, `debug_ev_${candidateId}`);

    let ledger = session.ledger || createEmptyLedger(session.sessionId);
    let memory = session.memory || createEmptyMemory();

    let turn1Answer = "";
    let turn2Answer = "";

    switch (scenario) {
      case "strength":
        turn1Answer = "To optimize HNSW search latency in ChromaDB, I adjust efConstruction and M parameters during index creation to balance build time against recall accuracy, and tune efSearch dynamically at query time based on SLA bounds.";
        turn2Answer = "Vector embeddings capture dense semantic relationships; Cosine similarity measures the angle between normalized vectors to evaluate semantic proximity.";
        break;

      case "contradiction":
        turn1Answer = "Reranking is generally unnecessary if dense vector embeddings are trained well enough.";
        turn2Answer = "Reranking is essential in every production RAG system because dense embeddings alone are unreliable.";
        break;

      case "refinement":
        turn1Answer = "Reranking is unnecessary for small prototypes.";
        turn2Answer = "In production RAG systems, reranking becomes essential to handle noisy retrieved chunks.";
        break;

      case "coverage-gap":
        turn1Answer = "Embeddings convert text into dense floating point vectors.";
        turn2Answer = "Cosine similarity measures vector proximity.";
        break;

      case "mixed":
      default:
        turn1Answer = "To debug RAG issues, I first inspect retrieved chunks before modifying the generation model.";
        turn2Answer = "I don't know the exact trade-off parameters for quantization in ChromaDB.";
        break;
    }

    const safeAuditTrace = [];

    // --- TURN 1 ---
    const plan1 = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    const q1 = buildPlaceholderQuestion(plan1);
    session = unwrap(addQuestion(session, q1));
    session = unwrap(submitAnswer(session, q1.id, turn1Answer));

    const topicDetail1 = topics.find((t) => t.day === q1.curriculumDay);
    const eval1 = await evaluateCandidateAnswer({
      question: q1,
      answer: turn1Answer,
      plan: plan1,
      learningObjectives: topicDetail1 ? topicDetail1.learningObjectives : [],
      forceFallback: true,
    });
    session = unwrap(attachAssessment(session, eval1));
    ledger = addTurnEvidenceToLedger(ledger, session.turns[0]);

    const claims1 = await extractClaimsFromAnswer({
      question: q1,
      answer: turn1Answer,
      plan: plan1,
      turnId: "turn_1",
      forceFallback: true,
    });
    memory = addTurnToMemory(memory, session.turns[0], claims1, []);

    safeAuditTrace.push({
      turnIndex: 1,
      questionText: q1.text,
      candidateAnswer: turn1Answer,
      assessmentSummary: eval1.summary,
      performanceSignal: eval1.performanceSignal,
      evidenceAdded: ledger.entries.map((e) => `[${e.type.toUpperCase()}] ${e.competency}: ${e.observation}`),
    });

    // --- TURN 2 ---
    const plan2 = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    const q2 = buildPlaceholderQuestion(plan2);
    session = unwrap(addQuestion(session, q2));
    session = unwrap(submitAnswer(session, q2.id, turn2Answer));

    const topicDetail2 = topics.find((t) => t.day === q2.curriculumDay);
    const eval2 = await evaluateCandidateAnswer({
      question: q2,
      answer: turn2Answer,
      plan: plan2,
      learningObjectives: topicDetail2 ? topicDetail2.learningObjectives : [],
      forceFallback: true,
    });
    session = unwrap(attachAssessment(session, eval2));
    ledger = addTurnEvidenceToLedger(ledger, session.turns[1]);

    const claims2 = await extractClaimsFromAnswer({
      question: q2,
      answer: turn2Answer,
      plan: plan2,
      turnId: "turn_2",
      forceFallback: true,
    });

    const pairs = findComparableClaimPairs(memory.claims, claims2);
    const newSignals = [];
    for (const pair of pairs) {
      const signal = await analyzeContradictions({ earlierClaim: pair.earlier, laterClaim: pair.later, forceFallback: true });
      if (signal) {
        newSignals.push(signal);
        ledger = addContradictionEvidenceToLedger(ledger, signal, pair.earlier.turnId, pair.later.turnId, q2.curriculumDay);
      }
    }

    memory = addTurnToMemory(memory, session.turns[1], claims2, newSignals);

    safeAuditTrace.push({
      turnIndex: 2,
      questionText: q2.text,
      candidateAnswer: turn2Answer,
      assessmentSummary: eval2.summary,
      performanceSignal: eval2.performanceSignal,
      evidenceAdded: ledger.entries.slice(safeAuditTrace[0].evidenceAdded.length).map((e) => `[${e.type.toUpperCase()}] ${e.competency}: ${e.observation}`),
    });

    ledger.matrix = getEvidenceCoverageMatrix(ledger, topics);
    session.ledger = ledger;
    session.memory = memory;

    const evidenceGapSignal = getEvidenceGapSignalForPlanner(ledger, session);
    const nextPlan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      evidenceGapSignal,
    });

    return NextResponse.json({
      status: "success",
      scenario,
      candidate: { id: intelligence.candidate.id, name: intelligence.candidate.name },
      turnsSummary: session.turns.map((t) => ({ questionText: t.question.text, answer: t.answer })),
      evidenceLedger: {
        sessionId: ledger.sessionId,
        totalEntries: ledger.entries.length,
        entries: ledger.entries,
      },
      evidenceCoverageMatrix: ledger.matrix,
      unresolvedGaps: getGapEvidence(ledger),
      plannerEvidenceSignal: evidenceGapSignal,
      nextPlannedTurn: {
        topic: nextPlan.topic,
        difficulty: nextPlan.difficulty,
        action: nextPlan.action,
        reasonForSelection: nextPlan.reasonForSelection,
      },
      safeAuditTrace,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Evidence error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
