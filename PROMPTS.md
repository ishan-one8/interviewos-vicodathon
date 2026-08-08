# PROMPTS.md

A running log of prompts and AI-assisted milestones for InterviewOS hackathon verification.

---

## Milestone 4 — Official Data Foundation & Repository Audit

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Establish a reliable data foundation using official hackathon dataset files (`curriculum.json` and `candidates.json`), perform a thorough repository audit, resolve path alias and directory structure issues, build strongly-typed domain models & normalizers, and create a data verification debug endpoint.

**Architectural Decisions:**
1. **Repository Audit & Directory Unification:**
   - Identified duplicate competing `app/` root directory vs canonical `src/app/` structure.
   - Unified Next.js App Router files (`layout.tsx`, `page.tsx`, `globals.css`) under `src/app/`.
   - Updated `tsconfig.json` path alias `@/*` -> `./src/*` for seamless module resolution.
2. **Decoupled Domain Layer & Safety Normalizers:**
   - Created Zod validation schemas (`RawCurriculumSchema`, `RawCandidateDatasetSchema`) to safely validate raw organizer JSON.
   - Built pure normalizers (`src/lib/curriculum/normalizer.ts` and `src/lib/candidate/normalizer.ts`) to map raw data into strongly-typed internal domain models (`CurriculumTopic`, `CandidateProfile`, `SkillHypothesis`, etc.).
   - Implemented memory-cached data access layer (`src/lib/data.ts`) with zero external service dependencies.
3. **Debug API Endpoint:**
   - Exposed `GET /api/debug/data` to verify curriculum parsing (31 topics across 8 modules) and candidate loading (20 candidate profiles with completed/skipped missions & attempt histories).

**Files Created / Modified:**
- `tsconfig.json` — Updated `@/*` path alias to `./src/*`.
- `hackathon-resources/curriculum.json` & `src/data/curriculum.json` — Official 31-day AI Cohort syllabus.
- `hackathon-resources/candidates.json` & `src/data/candidates.json` — Official 20 candidate profile dataset.
- `src/types/interview.ts` — Defined strongly-typed domain models & Zod schemas.
- `src/lib/curriculum/normalizer.ts` — Curriculum Zod parsing and normalization logic.
- `src/lib/candidate/normalizer.ts` — Candidate dataset normalization & attempt/skipped topic extractor.
- `src/lib/data.ts` — Central data access layer (`getCurriculum`, `getCandidates`, `getCandidateById`, `getCurriculumTopicByDay`).
- `src/app/api/debug/data/route.ts` — Development & evaluation debug route.
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — Standardized Next.js App Router setup inside `src/app/`.
- `PROMPTS.md` — Logged Milestone 4 progress.

---

## Milestone 5 — Candidate Intelligence Engine

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build a deterministic, fair, evidence-backed Candidate Intelligence Engine on top of the Milestone 4 data foundation that calculates skill hypotheses, exposure levels, confidence scores, interview priorities, and starting difficulty recommendations without LLM overhead or non-deterministic variance.

**Architectural Decisions:**
1. **Deterministic Pure Function Profiling:**
   - Designed `profileCandidate(candidate, curriculum)` as a pure function in `src/lib/candidate/profiler.ts`.
   - Every curriculum topic receives an explicit `SkillHypothesis` containing `estimatedStrength` (0..1), `confidence` (0..1), `exposure`, `interviewPriority`, `recommendedDifficulty`, `isSkipped`, `attemptsCount`, and readable `evidence`.
2. **Fairness Rules for Skipped & Missing Data:**
   - Skipped topics are assigned `interviewPriority: "avoid"` and `isSkipped: true` without penalizing overall completed topic mastery scores.
   - Missing optional fields default safely without throwing exceptions or returning `NaN`.
3. **Attempt Penalties & Verification Tagging:**
   - 1-attempt mission passes receive a strength credit (+0.15).
   - $\ge 3$-attempt passes are tagged as struggle topics with `interviewPriority: "high"` and `recommendedDifficulty: "debugging"`, placing them into `topicsToVerify`.
4. **Debug API Endpoint & Automated Test Suite:**
   - Created `GET /api/debug/profile?candidateId=<id>` route.
   - Built automated test suite `tests/candidate-intelligence.test.ts` covering strong candidates, retry-heavy candidates, skipped topic candidates, missing data edge cases, and 100% determinism verification.

**Files Created / Modified:**
- `src/types/interview.ts` — Added `SeniorityTier`, `InterviewPriority`, `SkillHypothesis`, and `CandidateIntelligenceReport` interfaces.
- `src/lib/candidate/profiler.ts` — Implemented deterministic scoring, seniority classification, topic prioritization, and evidence compiler.
- `src/lib/data.ts` — Added `getCandidateIntelligence(candidateId)` helper.
- `src/app/api/debug/profile/route.ts` — Created `GET /api/debug/profile` route.
- `tests/candidate-intelligence.test.ts` — Automated unit/integration test suite.
- `PROMPTS.md` — Logged Milestone 5 progress.

---

## Milestone 6 — Deterministic Interview State Machine & Guardrails

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build a pure, deterministic Interview State Machine and hard hackathon coverage guardrails (`MIN_QUESTIONS = 8`, `MIN_CURRICULUM_DAYS = 4`, `MAX_QUESTIONS = 12`) to strictly govern lifecycle, state transitions, duplicate prevention, and completion eligibility without relying on LLM logic.

**Architectural Decisions:**
1. **Deterministic Code Ownership:**
   - Code strictly owns state transitions (`addQuestion`, `submitAnswer`, `attachAssessment`, `completeInterview`, `failInterview`) returning typed `Result<InterviewState, InterviewStateError>` containers.
   - Magic numbers are consolidated into `src/lib/interview/constants.ts` (`MIN_QUESTIONS = 8`, `MIN_CURRICULUM_DAYS = 4`, `MAX_QUESTIONS = 12`).
2. **Hard Hackathon Coverage Rules:**
   - `getCompletionStatus(state)` checks that $\ge 8$ total questions and $\ge 4$ unique curriculum days are satisfied before completion is eligible.
   - Repeated questions on the same curriculum day increment question count and follow-up count, but count only once toward unique curriculum day coverage.
3. **Invalid Transition Handling & Duplicate Detection:**
   - Rejects duplicate question IDs, duplicate normalized question texts, answers to non-existent questions, double answering, and completion attempts prior to meeting minimum requirements.
   - `normalizeQuestionText(text)` collapses whitespace, lowercases, and strips harmless punctuation.
4. **Debug Simulation Endpoint & Test Suite:**
   - Created `GET /api/debug/interview-state` simulation route.
   - Created `tests/interview-state.test.ts` covering 14 explicit state machine requirements.

**Files Created / Modified:**
- `src/lib/interview/constants.ts` — Hard guardrail constants (`MIN_QUESTIONS = 8`, `MIN_CURRICULUM_DAYS = 4`, `MAX_QUESTIONS = 12`).
- `src/lib/interview/errors.ts` — Typed error codes and `Result<T, E>` pattern.
- `src/lib/interview/state.ts` — `createInterviewSession`, text normalization, and duplicate text detection.
- `src/lib/interview/selectors.ts` — Pure state selectors (`getCompletionStatus`, `canCompleteInterview`, `getLastTurn`, `getAskedQuestionIds`, `getCoveredCurriculumDays`, `getUncoveredCurriculumDays`).
- `src/lib/interview/transitions.ts` — Pure state transitions (`addQuestion`, `submitAnswer`, `attachAssessment`, `completeInterview`, `failInterview`).
- `src/types/interview.ts` — Extended `InterviewTurn`, `CompletionStatus`, and `InterviewState`.
- `src/app/api/debug/interview-state/route.ts` — Debug simulation route for state machine scenarios.
- `tests/interview-state.test.ts` — Comprehensive 14-test verification suite.
- `PROMPTS.md` — Logged Milestone 6 progress.

---

## Milestone 7 — Adaptive Question Planner & Interview Strategy Engine

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build a deterministic Adaptive Question Planner and Strategy Engine (`planNextQuestion`) that evaluates candidate intelligence, interview state, coverage guardrails, and performance signals to generate a transparent, evidence-backed `QuestionPlan` describing *WHAT* to test, *WHICH* curriculum day to cover, *WHAT* difficulty to use, and *WHY*.

**Architectural Decisions:**
1. **Deterministic Topic Scoring & Ranking:**
   - Implemented pure scoring heuristics in `src/lib/interview/planner-scoring.ts`.
   - Incorporates completed day bonuses (+30), verification bonuses for retry-heavy topics (+40), module diversity (+15), and coverage rescue priorities (+85).
   - Enforces deterministic tie-breaking (priority score desc -> confidence desc -> day number asc -> topic title asc).
2. **Three Interview Phases & Strategic Adaptation:**
   - Evaluates `phase`: Calibration (Q1–3), Deepening (Q4–7), and Coverage/Closing (Q8+).
   - Recommends difficulty progression (`foundation` -> `intermediate` -> `advanced` -> `debugging` -> `architecture` -> `tradeoff`).
   - Adapts to optional performance signals (`strong` -> escalate, `weak` -> lower, `partial`/`unclear` -> clarify, `contradictory` -> challenge).
3. **Coverage Rescue Mode & Skipped Topic Fairness:**
   - Activates `coverage_rescue` mode if unique curriculum days $< 4$ when approaching `MAX_QUESTIONS = 12` or $\ge 7$ questions asked.
   - Enforces fairness for skipped topics (penalized by -100 so they are not selected first or forced unfairly for coverage).
4. **Debug Endpoint & Test Suite:**
   - Created `GET /api/debug/planner` route for inspecting multi-turn planning simulations and coverage rescue scenarios.
   - Built comprehensive automated test suite `tests/planner.test.ts` with 16 explicit test cases (all passing).

**Files Created / Modified:**
- `src/types/interview.ts` — Added `QuestionPlan`, `PerformanceSignal`, `InterviewPhase`, and `SelectionMode`.
- `src/lib/interview/planner-policy.ts` — Phase determination, difficulty recommendations, action selection, and objective generation.
- `src/lib/interview/planner-scoring.ts` — Deterministic topic scoring, weighting heuristics, and tie-breaking.
- `src/lib/interview/question-template.ts` — Deterministic debug placeholder question generator.
- `src/lib/interview/planner.ts` — Main `planNextQuestion` strategy engine entry point.
- `src/app/api/debug/planner/route.ts` — Debug simulation API route.
- `tests/planner.test.ts` — 16-scenario verification test suite.
- `PROMPTS.md` — Logged Milestone 7 progress.

---

## Milestone 8 — Gemini Technical Question Generator & Mandatory Fallback

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Integrate Gemini-powered natural language technical question generation (`generateInterviewQuestion`) using `@google/genai` to turn approved `QuestionPlan` strategy objects into realistic, natural interviewer questions spoken by persona **Ari** (Senior AI Systems Engineer), with strict prompt injection defense and a mandatory deterministic fallback generator.

**Architectural Decisions:**
1. **Decoupled Strategic Control:**
   - The LLM does NOT control the interview lifecycle or question strategy. Milestone 7 `QuestionPlan` strictly controls curriculum day, topic, difficulty, action, and objective. Gemini only formats the approved plan into natural spoken interviewer phrasing.
2. **Structured Output & Zod Validation:**
   - Uses `GeneratedQuestionSchema` (`question`, `shortIntent`, `expectedCompetency`) with JSON response schema.
   - Strictly validates output length, content, and absence of internal metric leaks (`estimatedStrength`, `confidence`, `priorityScore`, `QuestionPlan`).
3. **Prompt Injection Safeguards:**
   - Candidate previous answer text is treated as untrusted data and wrapped in `<candidate_response_untrusted>` XML tags.
   - System instructions explicitly forbid override of system instructions or topic/difficulty from candidate input.
4. **Mandatory Fallback Generator:**
   - Automatically activates deterministic placeholder generator (`source: "fallback"`) if `GEMINI_API_KEY` is missing, API call fails, times out, returns invalid JSON, or fails safety validation.
   - Zero application crashes or 500 status codes when external API is unavailable.
5. **Debug Endpoint & Test Suite:**
   - Created `GET /api/debug/question-generator` route supporting forced fallback test query `?fallback=true`.
   - Created `tests/question-generator.test.ts` containing 15 test cases (100% pass rate).

**Files Created / Modified:**
- `.env.example` — Environment template for `GEMINI_API_KEY` and `GEMINI_MODEL`.
- `src/types/interview.ts` — Added `GeneratedQuestionSchema`, `GeneratedQuestion`, and `QuestionGenerationOutput`.
- `src/lib/interview/errors.ts` — Added Gemini error codes (`GEMINI_KEY_MISSING`, `GEMINI_EMPTY_RESPONSE`, `GEMINI_API_ERROR`).
- `src/lib/ai/gemini.ts` — Server-side `@google/genai` client helper with timeout and structured JSON response parsing.
- `src/lib/ai/question-generator.ts` — Question generation service with Ari system persona, injection defense, safety validator, and fallback.
- `src/app/api/debug/question-generator/route.ts` — Debug API route for live generation and forced fallback testing.
- `tests/question-generator.test.ts` — 15-scenario verification test suite.
- `PROMPTS.md` — Logged Milestone 8 progress.

**Verification:**
- Test suite passed 50/50 tests across all 4 test suites (`candidate-intelligence.test.ts`, `interview-state.test.ts`, `planner.test.ts`, `question-generator.test.ts`).
- `npm run lint` returned 0 errors and 0 warnings.
- Production build `npm run build` completed cleanly with zero TypeScript or Next.js errors.

---

## Milestone 9 — Candidate Answer Intelligence Engine & Structured Competency Scoring

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build a Gemini-powered Candidate Answer Intelligence Engine (`evaluateCandidateAnswer`) with Zod-validated structured output, scoring across 5 technical competency dimensions on a strict 0–4 scale, prompt-injection defense, deterministic fallback evaluation, difficulty helpers, and seamless adaptive planner integration.

**Architectural Decisions:**
1. **Gemini as Evaluator, Code as Controller:**
   - Gemini evaluates candidate answer semantic quality and returns structured assessment (`correctness`, `depth`, `reasoning`, `practicalUnderstanding`, `tradeoffAwareness`, `performanceSignal`, `strengths`, `gaps`, `evidence`, `summary`, `recommendedAction`, `recommendedDifficulty`, `confidence`).
   - Code state machine strictly owns interview lifecycle, turn recording, question count, and completion eligibility.
   - Adaptive Planner (`planNextQuestion`) consumes `performanceSignal` via an adaptation bridge to adjust next question strategy.
2. **5 Competency Dimensions & 0–4 Scoring Scale:**
   - `correctness` (0–4): Material technical correctness.
   - `depth` (0–4): Knowledge beyond surface definitions.
   - `reasoning` (0–4): Explanation of why and how.
   - `practicalUnderstanding` (0–4): Application in real engineering scenarios.
   - `tradeoffAwareness` (0–4): Recognition of trade-offs, limits, and alternatives.
   - Verbosity is not rewarded; self-claims ("I am an expert") provide $0.0$ score advantage.
3. **Native `@google/genai` Structured Output & Fallback Evaluator:**
   - Implemented native `@google/genai` `Type.OBJECT`, `Type.NUMBER`, `Type.STRING`, `Type.ARRAY` schema definitions.
   - Validates response with Zod `AnswerAssessmentSchema`.
   - Deterministic fallback evaluator activates if `forceFallback`, API key is missing, network fails, or validation fails, returning a safe, conservative neutral evaluation (`confidence: 0.25`, `performanceSignal: "unclear"`).
4. **Prompt Injection Safeguards & Special Answers:**
   - Candidate answers wrapped in `<candidate_response_untrusted>` XML tags; system prompt instructs evaluator to ignore candidate attempts to override scores or system instructions.
   - Special answer handlers evaluate empty answers, `"I don't know"`, and single-word vague answers (`"it depends"`, `"yes"`) deterministically.
5. **Debug Endpoint & Test Suite:**
   - Created `GET /api/debug/answer-evaluator` supporting `scenario=strong|partial|weak|unclear|injection|fallback`.
   - Created `tests/answer-evaluator.test.ts` containing 22 verification tests (72/72 total tests passing across full codebase).

**Files Created / Modified:**
- `src/lib/interview/difficulty.ts` — `increaseDifficulty` and `decreaseDifficulty` progression helpers.
- `src/types/interview.ts` — Added `CompetencyScoreSchema`, `AnswerAssessmentSchema`, `AnswerAssessment`, and `AnswerEvaluationOutput`.
- `src/lib/interview/transitions.ts` — Updated `attachAssessment` to support `(state, assessment)` overload.
- `src/lib/ai/answer-evaluator.ts` — Candidate answer intelligence engine, special answer handlers, injection defense, and fallback evaluator.
- `src/app/api/debug/answer-evaluator/route.ts` — Debug simulation API route.
- `tests/answer-evaluator.test.ts` — 22-scenario verification test suite.
- `PROMPTS.md` — Logged Milestone 9 progress.

**Verification:**
- Test suite passed 72/72 tests across all 5 test suites (`candidate-intelligence.test.ts`, `interview-state.test.ts`, `planner.test.ts`, `question-generator.test.ts`, `answer-evaluator.test.ts`).
- `npm run lint` returned 0 errors and 0 warnings.
- Production build `npm run build` completed cleanly with zero TypeScript or Next.js errors.

---

## Milestone 10 — Cross-Turn Interview Memory & Contradiction Detection

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build cross-turn interview memory (`InterviewMemory`), structured claim extraction (`extractClaimsFromAnswer`), hybrid contradiction detection (`analyzeContradictions`), and memory-aware planner signals (`getMemorySignalsForPlanner`) so InterviewOS remembers candidate statements across turns and resolves apparent inconsistencies gracefully.

**Architectural Decisions:**
1. **Strongly Typed Interview Memory:**
   - Implemented `CandidateClaim`, `ContradictionSignal`, `TopicMemory`, `MemoryIssue`, and `InterviewMemory` in `src/types/interview.ts`.
   - Immutable memory state helpers (`createEmptyMemory`, `addTurnToMemory`, `resolveMemoryIssue`, `resolveContradiction`) in `src/lib/interview/memory.ts`.
2. **Grounded Claim Extraction:**
   - Evaluates candidate answers per turn and extracts 0–4 concise technical claims (`extractClaimsFromAnswer`) using native `@google/genai` structured output (`Type.OBJECT`, `Type.ARRAY`).
   - Candidate answers wrapped in `<candidate_response_untrusted>` XML tags for prompt injection protection.
   - Claims deduplicated deterministically.
3. **Deterministic Filtering + Gemini Contradiction Analysis:**
   - `findComparableClaimPairs` pre-filters claims on same topic or related curriculum concept to minimize LLM token usage.
   - `analyzeContradictions` classifies relationship into `consistent`, `possibly_contradictory`, `contradictory`, `context_changed`, or `insufficient_context`.
   - Explanations are non-accusatory and strictly technical/neutral. Differences are treated as opportunities to clarify.
4. **Adaptive Planner Memory Bridge:**
   - `getMemorySignalsForPlanner` generates signals (`unresolvedContradiction`, `topic`, `recommendedAction`, `reason`) for `planNextQuestion`.
   - Planner incorporates memory signals to select `action: "clarify"` or `action: "challenge"`.
   - Hard state-machine guardrails (`MIN_QUESTIONS=8`, `MIN_CURRICULUM_DAYS=4`, `MAX_QUESTIONS=12`) and coverage rescue mode remain strictly authoritative.
5. **Debug Endpoint & Test Suite:**
   - Created `GET /api/debug/memory` route supporting `scenario=consistent|contradiction|context-change|resolved|injection`.
   - Created `tests/memory.test.ts` containing 20 test cases (92/92 total tests passing across codebase).

**Files Created / Modified:**
- `src/types/interview.ts` — Added `CandidateClaim`, `ContradictionSignal`, `TopicMemory`, `MemoryIssue`, `InterviewMemory`, and `PlannerMemorySignal`.
- `src/lib/ai/claim-extractor.ts` — Structured claim extraction service with prompt-injection defense.
- `src/lib/ai/contradiction-detector.ts` — Pre-filtering and Gemini contradiction analyzer.
- `src/lib/interview/memory.ts` — Immutable memory helpers and pure selectors.
- `src/lib/interview/planner.ts` — Integrated `PlannerMemorySignal` override into `planNextQuestion`.
- `src/app/api/debug/memory/route.ts` — Debug simulation route.

---

## Milestone 12 — Full Adaptive Interview Orchestrator & End-to-End Execution Loop

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build the end-to-end adaptive interview orchestrator (`orchestrator.ts`), session repository abstraction (`session-repository.ts`), candidate-safe snapshot builder (`orchestrator-snapshots.ts`), and session execution endpoints to connect all previous engine modules into one reliable interview execution workflow.

**Files Created / Modified:**
- `src/lib/interview/session-repository.ts` — Storage abstraction interface (`SessionRepository`) and `InMemorySessionRepository`.
- `src/lib/interview/orchestrator-snapshots.ts` — `buildSafeCandidateSnapshot` and `createEvent`.
- `src/lib/interview/orchestrator.ts` — Full lifecycle execution engine (`startAdaptiveInterview`, `submitInterviewAnswer`, `canFinishInterview`, `shouldFinishInterview`, `finishInterviewSession`, `getInterviewSnapshot`, `getInternalSnapshot`).
- `src/app/api/debug/interview/start/route.ts` — API route for starting session.
- `src/app/api/debug/interview/answer/route.ts` — API route for submitting candidate answer.
- `src/app/api/debug/interview/route.ts` — API route for inspecting snapshot.
- `src/app/api/debug/interview-simulation/route.ts` — API route for simulating full 8-turn interview loop.
- `tests/orchestrator.test.ts` — 29-scenario test suite.

---

## Milestone 13 — Final Competency Scoring Engine & Evidence-Backed Report

**Assisted by:** Google Antigravity (Gemini 3.6 Flash)

**Goal:**
Build the final deterministic competency scoring engine (`scoring.ts`), evidence-backed interview report generator (`report.ts`), topic result analyzer (`topics.ts`), evidence findings extractor (`findings.ts`), Gemini feedback writer with deterministic fallback (`feedback.ts`), and score explainability API (`explainability.ts`).

**Architectural Decisions:**
1. **100% Deterministic Numeric Scoring:**
   - All numeric scoring (0–4 raw, 0–100 normalized), competency status (`insufficient_evidence`, `developing`, `competent`, `strong`), and overall levels (`needs_development`, `developing`, `competent`, `strong`, `advanced`) are calculated purely in TypeScript code directly from the `EvidenceLedger`.
   - **Zero AI calls** are used for numeric scoring or evidence aggregation.
2. **Prior vs Demonstrated Score Separation:**
   - Candidate Intelligence Engine profile history (prior) is **strictly separated** from demonstrated interview scores. Prior history explains question selection, but never inflates or deflates demonstrated competency scores.
3. **Conservatively Weighted Difficulty Multipliers:**
   - Centralized difficulty constants in `constants.ts`: `foundation: 1.00`, `intermediate: 1.05`, `advanced: 1.10`, `debugging: 1.12`, `architecture: 1.15`, `tradeoff: 1.15`.
   - Wrong answers on advanced questions do not outscore correct answers on intermediate questions.
4. **Insufficient Evidence Handling:**
   - Unassessed competencies are marked `insufficient_evidence` with `confidence: 0.0` and excluded from pulling overall normalized score to 0, while penalizing overall confidence appropriately.
5. **Score Explainability API:**
   - `getScoreExplanation(ledger, dimension, state)` returns an exact mathematical breakdown of supporting vs gap evidence, difficulty multipliers, and evidence IDs without exposing internal LLM prompts or chain-of-thought.
6. **Gemini Feedback Writer + Fallback:**
   - Gemini receives ONLY deterministic scores, findings, and topic summaries to polish natural language feedback (`summary`, `strongestAreas`, `nextSteps`). Gemini has zero authority over numeric scores, levels, or evidence IDs.
   - If Gemini is unavailable, disabled, or times out, `generateDeterministicFeedback` takes over seamlessly with 2–5 specific technical recommendations.
7. **Debug Endpoint & Test Suite:**
   - Created `GET /api/debug/report?scenario=strong|mixed|insufficient-evidence|contradiction|refinement` and `GET /api/debug/report?sessionId=<id>`.
   - Created `tests/report.test.ts` containing 27 comprehensive test cases (173/173 total tests passing across codebase).

**Files Created / Modified:**
- `src/types/interview.ts` — Added `ReportLevel`, `CompetencyStatus`, `CompetencyResult`, `TopicResult`, `ReportFinding`, `ReportContradictionSummary`, `ScoreExplanation`, and `InterviewReport`. Added `report` to `OrchestrationResult` and `InternalInterviewSnapshot`.
- `src/lib/report/constants.ts` — Centralized difficulty weights (`DIFFICULTY_WEIGHTS`), level thresholds (`LEVEL_THRESHOLDS`), and level mapper (`getReportLevel`).
- `src/lib/report/scoring.ts` — Deterministic competency score aggregator (`calculateCompetencyResults`) and overall score aggregator (`calculateOverallResult`).
- `src/lib/report/topics.ts` — Curriculum topic results analyzer (`calculateTopicResults`).
- `src/lib/report/findings.ts` — Evidence-backed findings builder (`buildEvidenceBackedFindings`) and contradiction summarizer (`summarizeContradictions`).
- `src/lib/report/feedback.ts` — Structured Gemini feedback writer (`generateReportFeedback`) with deterministic fallback (`generateDeterministicFeedback`).
- `src/lib/report/explainability.ts` — Score explainability service (`getScoreExplanation`).
- `src/lib/report/report.ts` — Main report orchestrator (`buildInterviewReport`).
- `src/lib/interview/orchestrator.ts` — Integrated `buildInterviewReport` into `finishInterviewSession`.
- `src/app/api/debug/report/route.ts` — Debug simulation route for reports and score explanations.
- `tests/report.test.ts` — 27-scenario test suite.

**Verification:**
- Test suite passed 173/173 tests across all 9 test suites (`candidate-intelligence`, `interview-state`, `planner`, `question-generator`, `answer-evaluator`, `memory`, `evidence`, `orchestrator`, `report`).
- `npm run lint` returned 0 errors and 0 warnings.
- Production build `npm run build` completed cleanly with zero TypeScript or Next.js errors across 15 routes.




---

### Milestone 14 — Official Hackathon HTTP API Contract & Compliance

**Tool:** Google Antigravity
**Goal:** Implement the official ViCodathon 2026 HTTP API contract (`POST /api/interview` and alias `POST /api/agent`), request/response validation layer, multi-turn session persistence integration, and contract test suite.

**Key Accomplishments & Implementation Architecture:**
1. **Source of Truth Zod Contract Schemas (`src/lib/api/contract.ts`):**
   - Created `OfficialApiRequestSchema` supporting `candidateId` (start session) and `sessionId` + `questionId` + `answer` (continue session).
   - Created `OfficialQuestionSchema`, `OfficialCompetencyResultSchema`, `OfficialReportFindingSchema`, `OfficialReportFeedbackSchema`, `OfficialReportSchema`, and `OfficialApiResponseSchema`.
   - Guaranteed strict type validation and zero internal leakage (no `GEMINI_API_KEY`, system prompts, raw EvidenceLedger, or internal state machine metrics).
2. **Structured API Errors (`src/lib/api/errors.ts`):**
   - Implemented `ApiError` class and `formatErrorResponse` returning standardized JSON errors (`400 Bad Request`, `404 Not Found`, `405 Method Not Allowed`, `422 Unprocessable Entity`, `500 Internal Server Error`).
3. **Thin Request/Response Adapters (`src/lib/api/request-adapter.ts`, `src/lib/api/response-adapter.ts`):**
   - `handleOfficialInterviewRequest` validates candidates via `candidates.json` (returns `404 Candidate Not Found` for unknown candidates without silently defaulting), initializes session using Milestone 12 orchestrator, handles candidate answer submissions, checks idempotency for duplicate answer submissions, and triggers Milestone 13 report generator upon session completion.
   - `buildOfficialResponse` maps internal orchestration results into the exact `OfficialApiResponse` shape and validates it via `OfficialApiResponseSchema.parse` before sending.
4. **Official Route Handlers (`src/app/api/interview/route.ts`, `src/app/api/agent/route.ts`):**
   - Endpoint paths `POST /api/interview` and `POST /api/agent`.
   - HTTP method safety: `GET`, `PUT`, `DELETE` return `405 Method Not Allowed`.
5. **Contract Test Suite & Automation (`tests/contract.test.ts`, `package.json`):**
   - Added `npm run test:contract` script.
   - Created 23 comprehensive contract test scenarios covering valid requests, invalid types, missing fields, candidate validation, multi-turn session continuity, idempotency, prompt-injection resistance, candidate personalization contrast (CAND-003 vs CAND-004), Gemini fallback mode, and end-to-end contract simulation.

**Files Created / Modified:**
- `src/lib/api/contract.ts` — Official Zod request and response schemas.
- `src/lib/api/errors.ts` — Structured API error handler and HTTP status code mappers.
- `src/lib/api/request-adapter.ts` — Request processing adapter connecting HTTP requests to the orchestrator.
- `src/lib/api/response-adapter.ts` — Response mapper transforming orchestration results to official response payload.
- `src/app/api/interview/route.ts` — Primary official API endpoint handler (`POST /api/interview`).
- `src/app/api/agent/route.ts` — Alias official API endpoint handler (`POST /api/agent`).
- `src/lib/data.ts` — Added safety null check to `getCandidateById`.
- `src/lib/interview/orchestrator.ts` — Fixed candidate ID resolution in `finishInterviewSession`.
- `package.json` — Added `"test:contract"` script.
- `tests/contract.test.ts` — 23-scenario official contract test suite.

**Verification:**
- `npm test`: 196 / 196 tests passing across all 10 test suites (`candidate-intelligence`, `interview-state`, `planner`, `question-generator`, `answer-evaluator`, `memory`, `evidence`, `orchestrator`, `report`, `contract`).
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: Next.js production build compiled cleanly across 17 static & dynamic routes.

---

### Milestone 15 — Premium Candidate Interview UI, Lobby, Live Experience & Micro-Interactions

**Tool:** Google Antigravity
**Goal:** Build a serious, high-end candidate-facing adaptive interview interface (`/interview`), interview lobby, Ari interviewer identity, live technical question presenter, answer composer, progress tracking, calm error handling, and completion screen.

**Design System & Architectural Decisions:**
1. **Design System & Visual Language:**
   - Palette: Near-black/deep graphite (`#09090b`), subtle charcoal elevated surfaces (`#121215`), border overlays, refined indigo accent (`#6366f1`), cool cyan secondary, warm white hierarchy.
   - Inspired by modern developer tools (Linear, Raycast, Vercel) while maintaining an original identity.
2. **Product Shell & Navigation (`ProductShell`):**
   - Clean top navigation with "InterviewOS" wordmark, "Adaptive AI Technical Interviewer" badge, live system status, and "Start Interview" CTA.
3. **Homepage Upgrade (`src/app/page.tsx`):**
   - Truthful hero headline: *"An interview that thinks between your answers."*
   - Hero visual: Product-native SVG/CSS animated pipeline diagram (Candidate Context $\rightarrow$ Question Strategy $\rightarrow$ Live Answer $\rightarrow$ Adaptive Follow-up).
   - 4-step Product Proof section and System Guarantees section.
   - Frictionless demo mode: Start Interview $\rightarrow$ Lobby $\rightarrow$ Live evaluation in under 30 seconds.
4. **Interview Lobby & Candidate Selector (`CandidateSelector`):**
   - Displays official candidates from `candidates.json` (e.g. Emily Chen, David Miller).
   - Displays candidate name, target role, years of experience, and education.
   - Strictly **zero leakage** of hidden skill hypotheses, estimated strength scores, or weakness classifications.
   - Ari interviewer identity preview and reassurance: *"Your answers influence the questions that follow."*
5. **Ari Interviewer Identity (`InterviewerIdentity`):**
   - Senior AI Systems Engineer persona, calm, focused, and professional.
   - Abstract technical orbit/signal SVG mark with pulsating live state indicator (zero faces/cartoons).
6. **Live Question Card & Adaptive Follow-up UX (`QuestionCard`):**
   - Question number, Ari avatar, and question text formatted with high readability.
   - Safe metadata tags: Topic ("Embeddings & Vector Search"), Difficulty ("Advanced").
   - Adaptive follow-up badge: `BUILDING ON PREVIOUS ANSWER` appears when planner deepens or probes.
   - Contextual transition badge: `Transitioning topic focus to: ...` appears when switching topics.
7. **Answer Composer (`AnswerComposer`):**
   - Textarea with smooth focus state, character count indicator, and `Cmd+Enter` keyboard shortcut.
   - Double-submission lock and state protection.
   - Answer preservation on network error so typed text is never lost.
8. **Calm Processing & Error States (`ProcessingState`, `InterviewError`):**
   - Processing shimmer: *"Ari is evaluating your reasoning & preparing next question..."*
   - Calm error banner: *"We couldn't process that response yet. Your answer is preserved — try submitting again."* (Zero internal stack trace or LLM key leakage).
9. **Completion Screen (`CompletionState`):**
   - Renders upon session completion: "Technical Interview Complete".
   - Summary metrics (questions answered, curriculum areas covered).
   - CTA button: `View Interview Report` (`/report?sessionId=...`).
10. **Test Suite & Verification (`tests/ui.test.ts`):**
    - Added UI security and candidate privacy tests verifying candidates dataset loading, zero internal score leakage, candidate snapshot redaction, and question metadata safety.
    - All 201 tests across 11 test suites passing 100%.

**Files Created / Modified:**
- `src/components/ui/ProductShell.tsx` — Global header, descriptor, and footer shell.
- `src/components/interview/InterviewerIdentity.tsx` — Ari interviewer identity component with orbit mark.
- `src/components/interview/CandidateSelector.tsx` — Interview lobby candidate selection cards.
- `src/components/interview/QuestionCard.tsx` — Live technical question presentation component.
- `src/components/interview/AnswerComposer.tsx` — Answer composer with character count & keyboard shortcut.
- `src/components/interview/InterviewProgress.tsx` — Session progress bar and explored topics list.
- `src/components/interview/ProcessingState.tsx` — Answer submission loading shimmer.
- `src/components/interview/InterviewError.tsx` — Candidate-facing error banner.
- `src/components/interview/CompletionState.tsx` — Interview completion summary screen.
- `src/app/interview/page.tsx` — Main interactive interview lobby & live evaluation page controller.
- `src/app/page.tsx` — Upgraded homepage with hero pipeline visualization and capabilities.
- `tests/ui.test.ts` — 5-scenario UI security and candidate privacy test suite.
- `PROMPTS.md` — Appended Milestone 15 execution log.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **201 / 201 tests passing** across 11 test suites.
- `npm run build`: Next.js production build compiled cleanly across 18 static & dynamic routes.

---

## Milestone 17 — Demo Flow, Session-Bound Interviews & Adaptive Visibility

**Assisted by:** Claude Opus 4.6

**Goal:**
Create a judge-friendly demo experience at `/demo`, a session-bound interview route at `/interview/[sessionId]`, visible adaptive-AI indicators during interviews, and report enhancements — all using the SAME real interview engine with no fake demos or hardcoded scores.

**Architectural Decisions:**
1. **Separate UI API from official contract**: Created new API routes (`/api/demo/candidates`, `/api/demo/start`, `/api/interview/session`, `/api/interview/turn`) that delegate to the same orchestrator but return enriched UI-specific DTOs. The official hackathon contract (`POST /api/interview`) is completely unchanged.
2. **Safe adaptive context mapping**: Derives user-visible labels ("Follow-up", "Deeper Probe", "Clarification", "Challenge", "New Area") from `InterviewQuestion.action` field — no planner internals exposed. First question shows "Personalized Start" instead of implying prior-answer causation.
3. **No misleading progress percentage**: The UI shows explicit "Question N · At least 8" and "X curriculum areas explored" instead of a 0-100% bar that could imply a fixed endpoint.
4. **Completion policy stays in the orchestrator**: `/api/interview/turn` delegates entirely to `submitInterviewAnswer()` and reads the resulting state — no duplicate auto-finish logic in the route.
5. **Judge-optimized demo page**: Featured CAND-003/CAND-004 profiles surface first with "Try two profiles to see how InterviewOS starts from different learning contexts" — remaining profiles available via expand.

**Key Files:**
- `src/types/session-dto.ts` — DTO types: `InterviewSessionDTO`, `SafeAdaptiveContext`, `DemoCandidateCard`.
- `src/lib/interview/safe-dto.ts` — Safe DTO builder and adaptive context mapper.
- `src/app/demo/page.tsx` — Judge demo entry point with featured candidate cards.
- `src/app/interview/[sessionId]/page.tsx` — Session-bound interview: lobby → Q&A → completion.
- `src/app/api/demo/candidates/route.ts` — Safe candidate list (no intelligence, no missions).
- `src/app/api/demo/start/route.ts` — Session creation via real `startAdaptiveInterview()`.
- `src/app/api/interview/session/route.ts` — Session state read endpoint returning enriched DTO.
- `src/app/api/interview/turn/route.ts` — Answer submission via real `submitInterviewAnswer()`.
- `src/components/interview/SessionLobby.tsx` — Premium session lobby with candidate info and Ari identity.
- `src/components/interview/AdaptiveLabel.tsx` — Color-coded adaptive action badge.
- `src/components/interview/WhyThisQuestion.tsx` — Expandable "Why this question?" disclosure.
- `src/components/report/AdaptationSummary.tsx` — "How InterviewOS Adapted" section on report.
- `src/app/interview/page.tsx` — Replaced with server-side redirect to `/demo`.
- `tests/m17-demo-flow.test.ts` — 19-scenario M17 test suite.

**Security Guarantees:**
- `getCandidates()` never imported in any client component.
- `InterviewSessionDTO` contains zero fields from `CandidateIntelligenceReport`, `InterviewMemory`, `EvidenceLedger`, or `SkillHypothesis`.
- Safe adaptive context explanations are deterministic strings — never contain `priorityScore`, `plannerSignals`, `candidateEvidence`, or `reasonForSelection`.
- Error responses use safe messages — no stack traces returned.
- Gemini API key remains server-side only.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **230 / 230 tests passing** across 13 test suites (19 new M17 tests).
- `npm run build`: Next.js production build compiled cleanly across 26 static & dynamic routes.

---

## M18 — INTERVIEWOS PRODUCTIZATION + PREMIUM UI OVERHAUL

**Goal:** Transform InterviewOS from a hackathon prototype into a startup-grade product through a complete frontend overhaul. Remove all prototype language, redesign every screen with a premium dark design system, establish consistent design tokens, and make the UI feel like a real adaptive interview platform.

**Prompt excerpt:**
> "This is the final UI milestone. Transform every screen from 'hackathon project' into 'real adaptive interview product.' Remove all prototype/demo framing, redesign components with premium dark system console aesthetic, add the Interview Intelligence Pipeline diagram, and make every page feel like it belongs to the same product."

**What changed:**

### Design System Foundation
- Enhanced `globals.css` with CSS custom properties: `--background`, `--surface`, `--surface-raised`, `--border`, `--border-subtle`, `--accent`, `--accent-soft`, `--accent-muted`, `--cyan-signal`, `--text-secondary`, `--text-tertiary`.
- Added keyframe animations: `signal-flow`, `pipeline-pulse`, `fade-in-up`, `fade-in`, `score-fill`, `stage-progress`.
- Added `@media (prefers-reduced-motion: reduce)` to disable all animations.
- Added print styles for report page.

### ProductShell (`ProductShell.tsx`)
- Replaced Brain/ShieldCheck icons with inline SVG orbit signal mark.
- CTA: "Experience Interview" (not "Try Demo").
- Status: "Engine Active" (not "Adaptive Engine Ready").
- Footer: `InterviewOS — Adaptive Technical Interview Platform`.

### Homepage (`page.tsx`) — Complete Redesign
- Hero with "ADAPTIVE TECHNICAL INTERVIEWS" eyebrow, "An interview that thinks between your answers." headline.
- Interview Intelligence Pipeline diagram with 6 animated stages.
- "How InterviewOS Thinks" section — 4 connected stages (Understand, Adapt, Remember, Explain).
- "Watch It Adapt" section — illustrative adaptive pipeline example.
- Bottom CTA: "Ready to experience it?"

### Experience InterviewOS (`demo/page.tsx`)
- "Experience InterviewOS" eyebrow, "See how the same engine begins differently." heading.
- No candidate IDs shown anywhere.
- "Sample Profiles" label, "Same engine · Different starting strategy" callout.
- Clean candidate cards with radio selection indicators.

### Session Lobby (`SessionLobby.tsx`)
- "Technical Interview" eyebrow, "Welcome, {firstName}" heading.
- 2x2 grid: Format, Coverage, Follow-ups, Assessment.
- "No fixed script. Your answers influence what comes next."

### Ari Identity (`InterviewerIdentity.tsx`)
- Consistent orbit SVG icon across all components.
- Cleaner sizing, refined status text.

### Live Interview Console (`interview/[sessionId]/page.tsx`) — THE MOST IMPORTANT SCREEN
- Redesigned as AI Interview System Console.
- Top bar with exit link, question count, active status.
- Desktop grid layout: main interview area + context sidebar.
- Context rail: Ari identity card, session progress, explored topics.
- Mobile: progress below answer composer.

### Interview Components
- `QuestionCard.tsx`: Removed card wrapper, topic transition separators, metadata bar with adaptive label + topic + difficulty, question as dominant element.
- `AnswerComposer.tsx`: ArrowUp icon, "Submit" button, Cmd+Enter hint, character count.
- `AdaptiveLabel.tsx`: Dot indicators with color-coded pills.
- `WhyThisQuestion.tsx`: ChevronDown-only disclosure.
- `ProcessingState.tsx`: 3-stage intelligence transition with animated pulse dots and shimmer.
- `InterviewProgress.tsx`: Split into session metrics and explored topics cards.
- `CompletionState.tsx`: Emerald check, "Interview Complete", question/area counts.
- `InterviewError.tsx`: Consistent styling with CSS custom properties.

### Report Page (`report/page.tsx`) — Premium Redesign
- Removed "JUDGE DEMO MODE" badge.
- Removed `isJudgeMode` logic entirely.
- Clean tab navigation in surface pill style.
- Consistent card design across all sections.

### Report Components
- `ReportHeader.tsx`: Removed candidate ID display, clean score card with level badge, confidence line, 4-stat completion grid.
- `CompetencyBreakdown.tsx`: Refined horizontal competency rails with "Why?" expand, clean score bars, evidence trace sections.
- `TopicPerformance.tsx`: Clean topic cards with Strong/Competent/Developing badges.
- `StrengthsAndGaps.tsx`: Verified Strengths + Development Areas + Recommended Next Steps with numbered items.
- `InterviewReplay.tsx`: Premium vertical timeline with numbered nodes, decision traces, contradiction events, evidence generated.
- `AdaptationSummary.tsx`: Grid of adaptive action counts with color-coded numbers.
- `ReportSkeleton.tsx`: Updated loading skeleton with design tokens.

### Cross-Page Consistency
- All components use CSS custom properties (`var(--surface)`, `var(--border)`, etc.).
- Consistent `rounded-xl` border radius (not `rounded-3xl`).
- Consistent `text-[10px]`/`text-[11px]` font mono for metadata.
- Consistent spacing and card patterns.

### What was NOT modified (per spec constraints)
- All engine modules (orchestrator, planner, state machine, evaluator, question generator, memory, evidence ledger, scoring).
- Official API contract (`/api/interview`, `/api/agent`, `contract.ts`).
- Safe DTO builders, session architecture, Gemini integration.
- No voice, video, webcam, auth, billing, dashboard, fake analytics added.

**Files modified (14):**
1. `src/app/globals.css`
2. `src/components/ui/ProductShell.tsx`
3. `src/components/interview/InterviewerIdentity.tsx`
4. `src/app/page.tsx`
5. `src/app/demo/page.tsx`
6. `src/components/interview/SessionLobby.tsx`
7. `src/components/interview/AdaptiveLabel.tsx`
8. `src/components/interview/WhyThisQuestion.tsx`
9. `src/components/interview/QuestionCard.tsx`
10. `src/components/interview/AnswerComposer.tsx`
11. `src/components/interview/InterviewProgress.tsx`
12. `src/components/interview/ProcessingState.tsx`
13. `src/components/interview/CompletionState.tsx`
14. `src/components/interview/InterviewError.tsx`
15. `src/app/interview/[sessionId]/page.tsx`
16. `src/app/report/page.tsx`
17. `src/components/report/ReportHeader.tsx`
18. `src/components/report/CompetencyBreakdown.tsx`
19. `src/components/report/TopicPerformance.tsx`
20. `src/components/report/StrengthsAndGaps.tsx`
21. `src/components/report/InterviewReplay.tsx`
22. `src/components/report/AdaptationSummary.tsx`
23. `src/components/report/ReportSkeleton.tsx`

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **230 / 230 tests passing** across 13 test suites.
- `npm run build`: Next.js production build compiled cleanly.
- Browser verified: homepage, demo page, report page (header, competencies, topics, strengths, replay timeline).


---

## M18.1 — CINEMATIC DYNAMIC UI OVERHAUL

**Goal:** M18 was functionally correct but visually flat, static, and console-like. M18.1 rebuilds the visual + motion layer into a "Midnight Aurora AI System" — depth, layered aurora backgrounds, animated SVG signal paths, parallax, scroll-triggered reveals, and a living ARI identity — without touching any backend logic, engine, API contract, or session behavior.

**Approach:** Pure CSS + lightweight JS (IntersectionObserver, pointer parallax via rAF, `requestAnimationFrame` count-ups, `useSyncExternalStore` for reduced-motion, SMIL for particle motion paths). No animation library installed — avoids risk on the bleeding-edge Next 16 / React 19 stack and keeps the bundle lean.

**Visual system (`globals.css`):** Midnight-navy token palette; aurora blob keyframes (`aurora-drift`), signal-grid + noise overlays, animated gradient text (`.text-aurora`), glass panels, animated gradient borders, edge-glow hover lift, light-beam sweep, float animations, SVG path draw-in (`.draw-path`), focus-glow ring, scroll-reveal (`.reveal`), bar-fill transitions. Full `prefers-reduced-motion` override disabling parallax, continuous motion, and path traversal.

**Motion primitives (`src/components/visual/`):**
- `AuroraBackground` — layered aurora blobs + signal grid + noise (hero/subtle/panel variants).
- `Reveal` — IntersectionObserver scroll-reveal wrapper with stagger.
- `AriCore` — reusable abstract AI identity (concentric rings, orbit nodes, breathing core) with `ready`/`active`/`analyzing`/`complete` states.
- `AdaptiveCore` — hero centerpiece: ARI core + 6 signal nodes + animated connector paths with SMIL traveling particles + floating micro-panels + mouse parallax.
- `TypeReveal` — typewriter reveal on scroll-in.
- `ScoreArc` — animated radial score gauge with count-up.
- `useInView` — shared in-view hook for count-ups / bar fills.

**Homepage:** cinematic aurora hero with the Adaptive Intelligence Core replacing the static pipeline list; scroll-triggered "How InterviewOS Thinks"; "Watch It Adapt" with animated signal chips + typewriter next-question; ARI-anchored bottom CTA.

**Demo:** aurora backdrop; two premium profile cards with mouse-reactive glow, ARI cores, context-signal strips; "SAME ENGINE / DIFFERENT START" branching divider; on select, a candidate→ARI connection panel reveals "Begin Adaptive Interview".

**Interview:** cinematic lobby (large ARI stage with floating context labels + READY); live console with dominant question, focus-glow answer workspace, and a Live Intelligence Panel (ARI state, current area, interview signal, requirement meters, explored-areas spine); processing sequence with a 3-stage traveling light signal in the same workspace; adaptive badge transitions (verified PERSONALIZED START → DEEPER PROBE live).

**Report:** animated score arc as the climax; count-up competency bars (animate on scroll-in) with evidence dots; "How InterviewOS Adapted" now includes the real adaptive Path Taken map + counts; glowing draw-in replay timeline.

**Constraints honored:** No engine/planner/orchestrator/evaluator/scoring/API/session changes. No voice/video/webcam/auth/billing. No fabricated data — all report visuals bind to real DTO data. No auto-commit.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **230 / 230 tests passing** across 13 suites (backend untouched).
- `npm run build`: production build compiled cleanly across 26 routes.
- Browser verified live: homepage hero + core, demo selection→ARI, interview lobby, live console, processing sequence, adaptive transition (Q1→Q2), and report score arc (88/100) + adaptation path.

---

## M18.2 — LOVABLE-GRADE DYNAMIC PRODUCT EXPERIENCE + UI FUNCTIONAL AUDIT

**Goal:** M18/M18.1 were technically correct but visually flat (too much black, plain rectangles, weak hierarchy, documentation-like). M18.2 recomposes the visual experience into a richer, layered, motion-driven "Midnight Aurora" product — while keeping all engine/API/session logic untouched — and runs a full interactive/link audit.

**Approach:** Still dependency-free (pure CSS + light JS) — lowest risk on Next 16 / React 19, keeps the bundle lean. All motion via transform/opacity/SVG, IntersectionObserver, rAF, and `useSyncExternalStore` for reduced-motion.

### Audit findings & fixes
- **Dead link removed:** footer `Debug → /api/debug/data` link deleted from the user-facing shell.
- **Anchors fixed:** `#watch` → `#watch-it-adapt`; added `#showcase`; all nav/footer links now resolve to real section ids (verified: `/`, `/#how-it-works`, `/#watch-it-adapt`, `/#showcase`, `/demo`). No `href="#"`, no no-op buttons.
- **No user-facing debug/prototype wording or CAND IDs rendered** (CAND-003/004 remain internal-only constants).

### Global atmosphere
- Body now paints a layered radial-gradient midnight field (indigo/cyan/violet blooms) instead of flat black; fixed attachment for depth.
- Added a page-level `CursorGlow` that follows the pointer.

### New primitives (`src/components/visual/`)
`CursorGlow`, `SpotlightCard` (cursor spotlight + optional tilt), `FloatingPanel` (perspective drift), `ProductMockup` (browser-chrome frame), `MotionNumber` (count-up), `ThinkingFlow` (scroll-linked sticky ARI + stages), `ProductShowcase` (layered tilted mockups). Plus CSS utilities: perspective floats, grid drift, spotlight, localized question light, badge signal-sweep, question enter, nav underline, press compression, mobile-menu animation.

### Homepage (recomposed)
Hero: animated-gradient headline, proof chips (Context-aware · Cross-turn memory · Evidence-backed), and the **Adaptive Intelligence Orbit** — glowing ARI core, 6 signal nodes, animated connectors + SMIL particles, and four **floating product-preview panels** with perspective (FOLLOW-UP, MEMORY, CURRENT AREA, EVIDENCE ADDED). "How It Thinks" is now a **scroll-linked flow** with a sticky ARI core that changes state (ready→active→analyzing→complete) and a live mini-preview per stage. "Watch It Adapt" keeps the typewriter reveal. New **Product Showcase** section with three layered, tilted mockups (interview / report / replay) built from real primitives.

### Demo (recomposed)
Central ARI core **branches** into Emily and David; selecting a profile **illuminates that branch** (verified live) and the ProfileCards keep cursor-reactive glow + context-signal strips. "View all" grid animates in; every card selectable; no CAND IDs.

### Interview
Editorial question stage with a localized radial light and a badge **signal-sweep**; question re-keyed so transitions re-fire (blur→focus enter); Live Intelligence Panel with ARI state + animated requirement meters + explored-areas spine; premium focus-glow composer; processing sequence with a traveling light signal (verified: PERSONALIZED START → processing → DEEPER PROBE).

### Report
Animated score arc (verified 88/100) + **MotionNumber** count-ups on stats (8/4/31/3); "How InterviewOS Adapted" renders the real **Path Taken** map + counts; **interactive replay** — each of the 8 turns is a clickable expander (first open by default; active node glows).

### Mobile
Working **hamburger menu** (verified: opens, aria state flips, 4 valid links); hero/showcase/thinking-flow stack; floating panels hidden < sm; `overflow-x-hidden` guard; ThinkingFlow shows inline per-stage previews on mobile.

### Accessibility & performance
Full `prefers-reduced-motion` override (parallax/continuous motion/path-draw disabled, reveals forced visible); keyboard-accessible controls with visible focus rings; transform/opacity-only animations; SMIL particles skipped under reduced motion; CursorGlow skipped on coarse pointers.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **230 / 230 passing** (13 suites; backend untouched).
- `npm run build`: production build **clean**, 26 routes.
- Browser-verified: hero + floating orbit, demo branch illumination (David), report score arc + count-ups, replay interactivity (8 expanders), mobile hamburger + stacked hero. Some below-the-fold checks used DOM inspection due to a preview-pane scroll-capture limitation.

---

## M19 — PRODUCTION PERSISTENCE + SECURE SESSION RECOVERY

**Goal:** Turn in-memory prototype sessions into persistent, resumable, production-style sessions with opaque secure IDs — without touching the engine, Gemini, the official API contract, or the M18.2 visuals.

### Audit (what disappeared on restart)
Sessions lived only in an in-memory `Map` (`InMemorySessionRepository` / `defaultSessionRepository`); the module-level `eventStore` too. Session IDs were `session_${candidateId}_${Date.now()}` — **leaking the candidate id** in `/interview/[sessionId]` URLs. On server restart, all sessions and reports vanished. The report/replay DTO is derived entirely from `InterviewState` (turns, ledger, memory, coveredTopics), so persisting the state is sufficient for full recovery.

### Storage selected
Supabase PostgreSQL (opt-in). Single table `interview_sessions` (`supabase/schema.sql`): `id uuid pk, candidate_id, status, schema_version, version, state_json jsonb, report_json jsonb, created_at, updated_at, completed_at`, RLS enabled (service-role only). When env is unset, the app transparently uses the in-memory repository (local dev + tests).

### Repository architecture (engine stays storage-agnostic)
- `SessionRepository` interface (+ optional `saveReport`/`getReport`).
- `InMemorySessionRepository` (unit tests, fallback) — now also caches reports.
- `SupabaseSessionRepository` — JSONB state, optimistic-concurrency CAS, report cache.
- `repository-factory.ts::getSessionRepository()` is the ONLY place that chooses Supabase vs in-memory, imported only by the four API routes. The orchestrator/dto-builder keep `defaultSessionRepository` as their default, so `npm test` never touches a DB.

### Secure session IDs
`crypto.randomUUID()` (`generateSecureSessionId`). Verified live: `57ba2252-…` — no candidate id, no name, no counter. Candidate identity stays server-side.

### Versioned + validated state
`schema_version = 1`; `validatePersistedState` (Zod) checks the envelope + critical fields and passes engine internals through loosely — never blindly casting DB JSON. Corrupt payloads → safe null (unavailable), never a crash.

### Recovery behavior
- Refresh / independent request → same interview (verified: answered=2, turnCount=3, current question restored across separate HTTP calls).
- ACTIVE → restores the exact unanswered question (no new question generated on reload).
- COMPLETED → restores report; report JSON is persisted once and served verbatim (no AI-copy regeneration on reload).
- Unknown/invalid → safe `SESSION_NOT_FOUND` (404).

### Write order & idempotency
`load → validate question → process → generate state → persist → respond` — success is returned only after `saveSession`/`createSession` succeeds. Duplicate submit of an already-answered `questionId` is rejected (verified live: HTTP **409**, no duplicate turn / evidence / next question).

### Concurrency
Optimistic `version` column with atomic compare-and-swap `UPDATE … WHERE id AND version = expected`; the loser of a concurrent write gets `TURN_CONFLICT` (verified via a DB-free fake client). No locking infrastructure.

### Security & safe errors
Service-role key is server-only (non-`NEXT_PUBLIC_`, read in a server module imported only by routes) and never sent to the browser. `.env.example` documents variable **names** only; real `.env.local` untouched. Errors surface safe codes — `SESSION_NOT_FOUND`, `SESSION_UNAVAILABLE`, `TURN_CONFLICT`, `INVALID_REQUEST` — never SQL/Supabase internals or stack traces.

### Official API
`POST /api/interview`, `POST /api/agent`, and `contract.ts` are unchanged; only internal storage wiring changed. Regression coverage asserts the request/response schemas still parse.

### Env variables required (for persistence)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (+ run `supabase/schema.sql` once). `GEMINI_API_KEY` unchanged.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **245 / 245 passing** (14 suites; +15 new M19 tests; existing 230 green).
- `npm run build`: production build **clean**, 26 routes.
- Manual (in-memory, live server): secure UUID id, refresh recovery, duplicate-submit 409, safe unknown-session 404 — all confirmed. Server-restart survival requires the two Supabase env vars + `schema.sql` (code path proven by the automated persistence/CAS/report-cache tests).

---

## M19.1 — PERSISTENCE PROVIDER SWAP: Supabase → Neon Postgres

Supabase was replaced with **Neon PostgreSQL** (free-tier, no subscription) without redoing M19. All M19 architecture is preserved: opaque UUID session ids, `SessionRepository` abstraction, versioned + Zod-validated state, optimistic-concurrency CAS, duplicate-submit protection, completed-report persistence, candidate-safe DTOs, and safe error codes.

**Provider-specific layer swapped:**
- Removed: `src/lib/supabase/server-client.ts`, `src/lib/interview/supabase-session-repository.ts`, `supabase/schema.sql`. No runtime code references Supabase anymore. (`@supabase/supabase-js` predated M19 and is now unused — safe to `npm uninstall` if desired.)
- Added: `src/lib/db/client.ts` (server-only Neon HTTP driver exposing a generic `SqlExecutor`), `src/lib/interview/postgres-session-repository.ts` (`PostgresSessionRepository`, provider-neutral parameterized SQL + CAS), `database/schema.sql` (provider-neutral migration).
- Driver: `@neondatabase/serverless` (lightweight HTTP driver, ideal for Vercel serverless/cold starts; no pooling). The repository depends only on `SqlExecutor`, so any Postgres provider works later with a one-line change in `db/client.ts`.

**Env:** `DATABASE_URL` (replaces the two `SUPABASE_*` vars). `.env.example` updated with the name only.

**Concurrency:** preserved via `UPDATE interview_sessions SET …, version = $next WHERE id = $id AND version = $expected RETURNING version`; zero rows ⇒ `TURN_CONFLICT`.

**Verification:** `npm run lint` 0/0; `npm test` **245/245** (M19 suite now runs against `PostgresSessionRepository` via a DB-free fake `SqlExecutor`); `npm run build` clean.

---

## M20 — PRODUCTION SECURITY + RELIABILITY HARDENING

Harden InterviewOS for production Vercel deployment, hackathon judging, rate limiting, debug route protection, safe error response formatting, payload size caps, secret auditing, and attack resilience without altering M18.2 UI or core engine semantics.

### 1. Centralized Production Debug Route Protection (`src/lib/security/debug-policy.ts`)
- Implemented `guardDebugRoute()` as a shared production guard across all 13 `/api/debug/*` endpoints.
- When `NODE_ENV === "production"`, all debug endpoints return HTTP **404** (`{ success: false, error: "NOT_FOUND" }`), preventing public exposure of raw internal state, planner signals, candidate intelligence priors, or debug traces.
- In `development` and `test` environments, debug endpoints remain accessible for developer inspection.

### 2. Zero-Cost Process-Local Rate Limiting (`src/lib/security/rate-limiter.ts`)
- Added a lightweight sliding-window IP rate limiter to protect public endpoints (`POST /api/demo/start`, `POST /api/interview`, `POST /api/agent`, `POST /api/interview/turn`).
- **Architectural Limitations & Trade-offs:** Operates in-memory per Node process / Vercel Serverless Function instance. Serverless lambdas do not share memory across instances; this provides zero-cost burst protection on single instances without paid infrastructure (e.g. Upstash Redis).
- Generous limits (30 req/min for start, 60 req/min for turns) ensure legitimate hackathon demo traffic is never throttled. Automatically bypassed in `test` environment (`NODE_ENV === "test"`).

### 3. Security Headers (`next.config.ts`)
- Configured production security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` explicitly disabling unused browser media and hardware APIs.

### 4. Input Validation & Answer Length Limit
- Enforced strict Zod validation across API endpoints. Capped candidate answer length at **5,000 characters** in `OfficialApiRequestSchema` and `POST /api/interview/turn`.
- Aligned UI `<textarea>` in `AnswerComposer.tsx` with `maxLength={5000}` and visual character limit feedback (`/5000 chars`).

### 5. Error Response Sanitization & Failure Resilience
- Standardized error codes (`INVALID_REQUEST`, `SESSION_NOT_FOUND`, `SESSION_UNAVAILABLE`, `TURN_CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`).
- Zero stack traces, SQL connection details, or provider internals are returned to clients.
- Maintained deterministic fallbacks for Gemini question generation, answer evaluation, and report generation so provider outages do not crash active interviews.

### 6. Secret & Client Bundle Audit
- Audit confirmed `.env.local` is ignored, zero secrets committed, zero `NEXT_PUBLIC_` credential leaks, and no intelligence priors or raw internal ledger objects sent to client-facing DTOs.

### 7. Attack Test Suite (`tests/m20-security-hardening.test.ts`)
- Created 20 automated attack tests covering malformed JSON, missing/unknown candidates, invalid/unknown UUIDs, empty answers, oversized answers (>5,000 chars), wrong question IDs, duplicate submissions, stale turn submissions, completed session immutability, corrupted state validation, Gemini fallbacks, production debug route blocking, secret redaction, and official API contract regression.

**Verification:**
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **263 / 263 passing** (15 suites; +20 new M20 attack tests; existing 243 green).
- `npm run build`: production build **clean**, 26 routes.

