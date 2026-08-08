# InterviewOS — ViCodathon 2026 Submission Package

## 📌 Project Overview

- **Project Name**: InterviewOS
- **Tagline**: *"An interview that thinks between your answers."*
- **Live Production URL**: [https://interviewos-vicodathon.vercel.app](https://interviewos-vicodathon.vercel.app)
- **GitHub Repository**: [https://github.com/ishan-one8/interviewos-vicodathon](https://github.com/ishan-one8/interviewos-vicodathon)

---

## 🎯 Problem

Modern technical interviews suffer from two major flaws:
1. **Human Interviewer Bottlenecks**: High-quality technical interviews require senior engineering hours, leading to scheduling delays and inconsistent evaluation criteria across candidates.
2. **Naive AI Interview Tools**: Existing AI interview products rely either on rigid, script-based question banks that ignore candidate responses or unstructured LLM chat loops that lose track of curriculum coverage and hallucinate numeric evaluation scores.

---

## 💡 Solution: The InterviewOS Architecture

InterviewOS is an autonomous, adaptive AI technical interviewer that treats every interview as a dynamic, candidate-aware dialogue. It evaluates candidate responses in real-time, tracks technical claims across turns, identifies contradictory statements, and dynamically adjusts difficulty and topic selection.

### Core Architectural Innovation: *"LLM as Advisor, TypeScript as Controller"*

InterviewOS separates orchestration control from natural language generation:

- **Deterministic TypeScript Controller**:
  - Enforces hard state machine rules (minimum 8 questions, minimum 4 curriculum days).
  - Maintains the evidence ledger and computes numeric competency scores (0–100) strictly from observed evidence.
  - Manages session persistence, optimistic concurrency (CAS), duplicate submission idempotency, and security boundaries.
- **Google Gemini 2.5 Flash API (Advisor & Writer)**:
  - Formulates technical question phrasing tailored to planner directives.
  - Evaluates candidate answers against domain concepts into structured Zod JSON outputs.
  - Detects cross-turn claim contradictions and synthesizes report executive summaries.

If the LLM provider experiences latency or outages, InterviewOS automatically engages **deterministic fallbacks**, ensuring the interview proceeds without failing or corrupting session data.

---

## ✨ Key Features

1. **Candidate-Aware Starting Strategy**: Analyzes candidate background context (retries, skipped topics, project focus) to formulate a tailored initial probe instead of a static generic intro.
2. **Response-Driven Adaptation**: Dynamically selects planner actions after every turn:
   - `deepen`: Target advanced concepts when the candidate demonstrates strong mastery.
   - `clarify`: Probe partial answers to verify foundational understanding.
   - `challenge`: Test candidate confidence when conflicting claims are detected across turns.
   - `rescue`: Pivot to uncover missing curriculum day coverage when time is limited.
3. **Cross-Turn Memory & Contradiction Tracking**: Extracts technical claims from candidate responses and flags conflicting assertions across separate turns.
4. **Evidence-Backed Final Scoring**: Numeric competency scores (0–100) are aggregated deterministically from weighted evidence items. Scores are uninflated by candidate background priors.
5. **Session-Bound Neon Persistence**: Opaque UUID sessions (`/interview/[sessionId]`) persist to Neon PostgreSQL and survive browser reloads, server restarts, and serverless cold starts.
6. **Production Reliability & Hardening**: Process-local sliding-window rate limiting, HTTP security headers, input validation caps (5,000 chars), and production debug route blocking (`HTTP 404`).

---

## 📋 How InterviewOS Satisfies Challenge Requirements

| Requirement | Specification | InterviewOS Implementation | Verification Status |
| :--- | :--- | :--- | :--- |
| **Question Count** | Minimum 8 questions | State machine blocks completion until 8 turns are recorded. | **VERIFIED** (Automated Tests & Production) |
| **Curriculum Days** | Minimum 4 unique days | Planner tracks day coverage and activates rescue mode if behind. | **VERIFIED** (Automated Tests & Production) |
| **Follow-up Generation** | Based on candidate answers | Evaluator feeds score/claims → Planner selects follow-up strategy → Gemini writes targeted question. | **VERIFIED** (Automated Tests & Production) |
| **Cross-Turn Context** | Maintain interview memory | Memory engine extracts claims and tracks cross-turn contradictions. | **VERIFIED** (Automated Tests & Production) |
| **Structured Feedback** | Actionable assessment report | Generates executive summary, strengths with evidence links, development areas, and turn replay. | **VERIFIED** (Automated Tests & Production) |
| **Official HTTP Contract** | Standardized JSON endpoint | `POST /api/interview` & `POST /api/agent` implement exact Zod request/response contracts. | **VERIFIED** (Automated Tests & Production) |

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict mode)
- **AI Intelligence**: Google Gemini 2.5 Flash API (`@google/genai`)
- **Data Validation**: Zod Schema Validation
- **Database**: Neon PostgreSQL (`@neondatabase/serverless`)
- **Hosting & Infra**: Vercel Serverless Production Deployment
- **Testing Engine**: Node.js Native Test Runner (`node:test`)

---

## 🧪 Testing & Reliability Metrics

- **Total Test Suites**: 15 suites
- **Total Automated Tests**: **263 / 263 passing** (`npm test`)
- **ESLint Status**: **0 errors, 0 warnings** (`npm run lint`)
- **Production Build**: **Clean pass** across 26 static/dynamic routes (`npm run build`)
- **Attack Coverage**: 20 automated security & hardening attack tests

---

## 📜 AI Authenticity & Prompt Log

[PROMPTS.md](PROMPTS.md) contains an authentic, chronological log of all developer prompts, architectural decisions, and milestone iterations throughout the Vicodathon hackathon build.

---

## ⚠️ Known Limitations

1. **Rate Limiting**: Rate limiting operates in-memory per Vercel serverless function instance. On multi-region distributed serverless instances, rate limiting provides burst protection per instance rather than global state.
2. **Provider Fallbacks**: In the rare event of complete Gemini API outage, question generation uses deterministic technical fallback templates to maintain interview continuity.
