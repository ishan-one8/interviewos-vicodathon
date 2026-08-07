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

**Verification:**
- Successfully built project with `npm run build` (0 TypeScript / Next.js compilation errors).
- Validated `GET /api/debug/data` returning 31 curriculum topics and 20 candidates.
