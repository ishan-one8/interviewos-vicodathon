# InterviewOS

> **"An interview that thinks between your answers."**

InterviewOS is an autonomous, adaptive AI technical interviewer built for the ViCodathon 2026 Hackathon. Unlike static question-bank scripts or uncontrolled conversational bots, InterviewOS constructs a personalized starting strategy from candidate learning context, dynamically adapts its line of questioning after every response, maintains cross-turn evidence and contradiction tracking, and generates an evidence-backed, fully auditable final evaluation.

---

## 🚀 Live Links

- **Live Production Application**: [https://interviewos-vicodathon.vercel.app](https://interviewos-vicodathon.vercel.app)
- **GitHub Repository**: [https://github.com/ishan-one8/interviewos-vicodathon](https://github.com/ishan-one8/interviewos-vicodathon)

---

## 💡 Why InterviewOS?

Traditional AI interview tools fall into two failure modes:
1. **Rigid Scripts**: Static question trees that ignore candidate answers and fail to probe deeper when a candidate demonstrates mastery or makes contradictory claims.
2. **Uncontrolled LLMs**: Unbounded chat loops where the LLM invokes arbitrary scoring, loses track of curriculum coverage constraints, or hallucinates evaluation scores.

### **LLM is Advisor/Writer, Not Controller**

InterviewOS solves this by enforcing a strict architectural separation:

- **Deterministic TypeScript Core Controls**:
  - Interview lifecycle & status state machine (`active`, `completed`)
  - Hard minimum question count (8 questions) & curriculum coverage (4 unique days)
  - Topic selection, coverage rescue priorities, and difficulty escalation logic
  - Duplicate submission idempotency & optimistic concurrency (CAS)
  - Final competency scoring math (0–100) computed strictly from evidence
- **Gemini 2.5 Flash API Operates as Advisor/Writer**:
  - Formulates natural language technical questions tuned to planner specifications
  - Evaluates candidate answers against technical concepts with structured JSON outputs
  - Extracts key technical claims and analyzes cross-turn contradictions
  - Formulates executive report feedback summaries

Every AI output is validated with **Zod schemas**. If the LLM provider experiences latency or outages, InterviewOS seamlessly uses **deterministic fallbacks** without breaking the interview or corrupting session state.

---

## 📋 Hackathon Requirements Mapping

| Official Requirement | Challenge Specification | InterviewOS Implementation |
| :--- | :--- | :--- |
| **Minimum Questions** | At least 8 questions per interview | **Deterministic State Machine**: Enforces minimum 8-question limit before completion eligibility is unlocked. |
| **Curriculum Coverage** | At least 4 curriculum days covered | **Planner Coverage Rescue**: Tracks covered days and dynamically rescues uncovered curriculum days. |
| **Dynamic Adaptation** | Follow-up questions based on candidate answers | **Adaptive Strategy Engine**: Answer Evaluator assesses response quality → Planner triggers `deepen`, `clarify`, `challenge`, or `rescue`. |
| **Context Memory** | Maintain cross-turn interview context | **Memory & Contradiction Engine**: Extracts candidate claims across turns and detects conflicting statements. |
| **Structured Feedback** | Actionable assessment and report | **Evidence Ledger**: Accumulates weighted, evidence-backed competency scores and generates a visual report + replay timeline. |
| **Official HTTP API** | Standardized JSON contract endpoint | **`POST /api/interview`** & **`POST /api/agent`**: Validated via Zod schemas, supporting session initialization, turn submission, and report return. |

---

## 🏗 Architecture Diagram

```mermaid
flowchart TD
    subgraph Data Layer
        CD[Candidate Dataset] --> CI[Candidate Intelligence Priors]
    end

    subgraph State & Control Engine
        CI --> TS[Interview State Machine]
        TS --> Plan[Deterministic Strategy Planner]
    end

    subgraph AI Generation & Evaluation
        Plan -->|Topic & Strategy| QG[Gemini Question Generator]
        QG -->|Technical Question| CA[Candidate Answer]
        CA --> AE[Gemini Answer Evaluator]
        AE --> MC[Memory & Contradiction Detector]
    end

    subgraph Evidence & Persistence
        AE --> EL[Evidence Ledger]
        MC --> EL
        EL --> Plan
        TS <-->|Optimistic CAS| DB[(Neon PostgreSQL Session Repository)]
    end

    subgraph Final Scoring & Reporting
        EL --> DS[Deterministic Scoring Engine]
        DS --> Rep[Evidence-backed Final Report & Replay]
    end
```

---

## 🔄 The Adaptive Product Loop

```mermaid
graph LR
    Context[Candidate History] --> Plan[Plan Strategy]
    Plan --> Ask[Ask Technical Question]
    Ask --> Evaluate[Evaluate Answer]
    Evaluate --> Remember[Update Cross-Turn Memory]
    Remember --> Collect[Record Weighted Evidence]
    Collect --> Adapt{Requirements Met?}
    Adapt -->|No| Plan
    Adapt -->|Yes| Report[Generate Evidence Report]
```

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **AI Model**: [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/genai`
- **Validation**: [Zod](https://zod.dev/) schema validation across all DTOs and API endpoints
- **Database**: [Neon PostgreSQL](https://neon.tech/) (`@neondatabase/serverless` HTTP driver)
- **Deployment**: [Vercel](https://vercel.com/) Serverless Production Platform
- **Testing**: Node.js Native Test Runner (`node:test`, 15 test suites, 263 tests)
- **Styling**: Vanilla CSS, Glassmorphism, Tailwind utility classes, Lucide Icons

---

## 📂 Project Structure

```
interviewos-vicodathon/
├── database/
│   └── schema.sql             # PostgreSQL / Neon migration schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── interview/     # Official API endpoints (/api/interview & /api/agent)
│   │   │   ├── demo/          # Interactive candidate selection & start API
│   │   │   └── debug/         # Internal developer inspection tools (blocked in production)
│   │   ├── demo/              # Candidate profile selection screen
│   │   ├── interview/         # Dynamic session-bound candidate interview interface
│   │   └── report/            # Executive report & replay timeline viewer
│   ├── components/            # UI components (AnswerComposer, ReplayTimeline, etc.)
│   ├── lib/
│   │   ├── ai/                # Gemini question generator, evaluator, claim extractor
│   │   ├── api/               # Official API contract schemas and request adapters
│   │   ├── db/                # Neon database client driver
│   │   ├── interview/         # Core orchestrator, state machine, planner, memory, evidence
│   │   ├── report/            # Competency scoring engine, findings, report builder
│   │   └── security/          # Production debug policy and process-local rate limiter
│   ├── data/                  # Synthetic candidate profiles & curriculum dataset
│   └── types/                 # Shared TypeScript interfaces & types
├── tests/                     # 15 automated test suites (263 unit, contract, and attack tests)
├── .env.example               # Environment variable templates (zero real secrets)
├── next.config.ts             # Security headers configuration
├── ARCHITECTURE.md            # Deep technical architecture documentation
├── SUBMISSION.md              # ViCodathon hackathon submission package
├── DEMO.md                    # Technical judge demo walkthrough script
└── PROMPTS.md                 # Complete, truthful chronological AI usage log
```

---

## ⚡ Local Setup

### 1. Prerequisites
- Node.js `v20.9.0` or higher
- npm `v10.0.0` or higher

### 2. Clone & Install
```bash
git clone https://github.com/ishan-one8/interviewos-vicodathon.git
cd interviewos-vicodathon
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```
*(Note: If `DATABASE_URL` is omitted, InterviewOS automatically runs using an in-memory session repository, making local testing completely database-free).*

### 4. Database Setup (Optional for Neon/Postgres Persistence)
Run `database/schema.sql` against your PostgreSQL or Neon database to create the `interview_sessions` table.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment

InterviewOS is configured for zero-downtime deployment on Vercel:

1. **Environment Variables**: Set `GEMINI_API_KEY` and `DATABASE_URL` as server-side environment variables in Vercel project settings (never prefixed with `NEXT_PUBLIC_`).
2. **Build Command**: `npm run build`
3. **Output Directory**: Next.js Default

---

## 🎮 Interactive Product Flow

1. **Landing Page** (`/`): Introduces the adaptive architecture and interactive demo CTA.
2. **Candidate Selection** (`/demo`): Allows judges to pick from synthetic challenge candidate profiles (e.g., Emily Chen, Marcus Vance). *Note: Candidate profile selection exists to make the hackathon demo accessible. In production invitation flows, sessions are candidate-bound.*
3. **Session Lobby & Interview** (`/interview/[sessionId]`): A session-bound workspace identified by an opaque UUID URL. The candidate receives dynamic technical questions, sees real-time "Why This Question?" context, and submits answers.
4. **Final Report & Replay** (`/report`): Upon completing the interview requirements, InterviewOS generates a complete competency breakdown, evidence provenance links, adaptation summary, and a step-by-step turn replay.

---

## 🔒 Security, Privacy & Reliability Hardening

- **Opaque Session UUIDs**: Session IDs use cryptographically secure `crypto.randomUUID()` values (`3f8a2b1c-…`). Internal candidate IDs and intelligence metrics are never exposed in URLs or client DTOs.
- **Neon PostgreSQL Persistence**: Sessions survive browser reloads, server restarts, and serverless cold starts.
- **Optimistic Concurrency (CAS)**: Atomic `version` checks prevent race conditions and duplicate turn modifications (`TURN_CONFLICT`).
- **Idempotent Submissions**: Re-submitting an already answered question returns HTTP `409` without duplicating turns or evidence.
- **Production Debug Guarding**: All 13 `/api/debug/*` endpoints return HTTP `404` when `NODE_ENV === "production"`.
- **Input Hardening**: Candidate answers are capped at **5,000 characters** in API contracts and UI textareas.
- **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy` (disabling unused camera, microphone, geolocation, and USB APIs).
- **Process-Local Rate Limiting**: Sliding-window rate limiter prevents burst abuse on API routes while ensuring judge traffic is never blocked.

---

## 🧪 Testing & Verification

InterviewOS contains a comprehensive automated test suite with **263 tests across 15 test suites**:

```bash
# Run all 263 unit, contract, and attack tests
npm test

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Validate TypeScript type-checking and Next.js build
npm run build
```

### Verified Test Summary:
- **State Machine & Rules**: 14 tests
- **Planner & Strategy Engine**: 16 tests
- **Gemini Question Generator & Fallbacks**: 15 tests
- **Answer Evaluator & Claim Extractor**: 14 tests
- **Cross-Turn Memory & Contradiction Detection**: 20 tests
- **Evidence Ledger & Provenance**: 25 tests
- **Orchestrator Lifecycle**: 29 tests
- **Competency Scoring & Report Engine**: 27 tests
- **Official API Contract Compliance**: 23 tests
- **UI & Security DTO Redaction**: 5 tests
- **Report & Replay Rendering**: 10 tests
- **Demo Flow & Adaptive Visibility**: 19 tests
- **Postgres/Neon Persistence & Secure Recovery**: 16 tests
- **Production Security & Hardening Suite**: 20 attack tests

---

## 📡 Official Hackathon HTTP API Example

### Endpoint
`POST /api/interview` (or alias `POST /api/agent`)

### 1. Initialize Interview Session
**Request Body**:
```json
{
  "candidateId": "CAND-003"
}
```

**Response (HTTP 200 OK)**:
```json
{
  "sessionId": "4dff5a9a-063e-405b-bc05-099043abf1dd",
  "status": "active",
  "turnCount": 1,
  "coveredCurriculumDays": [7],
  "coveredTopics": ["Embeddings Explained"],
  "question": {
    "id": "q_7_mskqpoes_mmmx",
    "text": "When deriving dense vector representations from a Transformer backbone, how do pooling strategies like mean pooling versus CLS token extraction affect representation quality?",
    "topic": "Embeddings Explained",
    "curriculumDay": 7,
    "difficulty": "advanced"
  },
  "report": null
}
```

### 2. Submit Answer & Continue Session
**Request Body**:
```json
{
  "sessionId": "4dff5a9a-063e-405b-bc05-099043abf1dd",
  "questionId": "q_7_mskqpoes_mmmx",
  "answer": "Mean pooling averages token embeddings across all positions, preserving sentence-level semantics better for longer sequences, whereas CLS token representation relies heavily on pre-training objectives."
}
```

**Response (HTTP 200 OK - Next Question)**:
```json
{
  "sessionId": "4dff5a9a-063e-405b-bc05-099043abf1dd",
  "status": "active",
  "turnCount": 2,
  "coveredCurriculumDays": [7],
  "coveredTopics": ["Embeddings Explained"],
  "question": {
    "id": "q_7_mskqppk1_zibd",
    "text": "Deepening into Embeddings Explained details: What key design decisions and performance factors matter most when configuring vector index parameters?",
    "topic": "Embeddings Explained",
    "curriculumDay": 7,
    "difficulty": "advanced"
  },
  "report": null
}
```

---

## 📜 AI Usage & Authenticity

In accordance with ViCodathon rules, [PROMPTS.md](PROMPTS.md) maintains a complete, unedited, chronological log of all AI prompts, system architect decisions, and incremental milestone iterations from initial data foundation to production hardening and deployment.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
