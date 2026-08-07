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
