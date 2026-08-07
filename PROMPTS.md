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

**Verification:**
- Test suite passed 19/19 tests across `candidate-intelligence.test.ts` and `interview-state.test.ts` (100% pass rate).
- `npm run lint` returned 0 errors and 0 warnings.
- Production build `npm run build` completed successfully with zero TypeScript or Next.js errors.
