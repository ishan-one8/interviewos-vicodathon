# InterviewOS — Technical Judge Demo Checklist & Script

This guide provides a step-by-step walkthrough for hackathon judges evaluating InterviewOS live on production or locally.

---

## 🎯 Demo Summary

- **Production URL**: [https://interviewos-vicodathon.vercel.app](https://interviewos-vicodathon.vercel.app)
- **Primary API**: `POST /api/interview`
- **Key Focus**: Demonstrate how InterviewOS dynamically adapts between turns while enforcing strict deterministic control over question counts, curriculum coverage, scoring, and security.

---

## 📋 12-Step Judge Verification Walkthrough

### 1. Homepage & Architecture Overview (`/`)
- Navigate to [https://interviewos-vicodathon.vercel.app](https://interviewos-vicodathon.vercel.app).
- **Observe**: Clean motion UI introducing the tagline: *"An interview that thinks between your answers."*
- **Verification**: Open DevTools Network tab → Response Headers → Verify security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`

### 2. Explain the Adaptive Control Loop
- Highlight that InterviewOS is **not** an unbounded chat bot.
- Explain the 2-tier architecture: **TypeScript State Controller** handles lifecycle, coverage rules, evidence math, and persistence, while **Gemini 2.5 Flash** acts as an advisor for question formulation and answer evaluation.

### 3. Select Candidate Profile (`/demo`)
- Click **Experience InterviewOS** or navigate to `/demo`.
- **Select Profile**: Pick **CAND-003 (Emily Chen)** or **CAND-004 (Marcus Vance)**.
- **Observe**: Notice how candidates have different learning context backgrounds (retries, skipped topics, project focus), leading to completely personalized starting strategies.

### 4. Initialize Persistent Interview Session (`/interview/[sessionId]`)
- Click **Start Interview**.
- **Observe URL**: The browser redirects to `/interview/3f8a2b1c-…` (an opaque UUID).
- **Verify Privacy**: Notice that internal candidate IDs (`CAND-003`) and raw metric priors are strictly omitted from the URL and client state.

### 5. Answer Question 1 (Live Gemini Generation)
- **Read Question 1**: The first question is dynamically formulated by Gemini 2.5 Flash based on candidate profile context.
- **Submit Answer**: Type a technical answer into the composer:
  > *"Mean pooling averages token embeddings across all positions, preserving sentence-level semantics better for longer sequences, whereas CLS token extraction relies heavily on pre-training objectives."*
- **Submit**: Click **Submit Answer**.

### 6. Observe Response-Driven Follow-Up (Turn 2)
- **Observe**: InterviewOS processes the response in real-time.
- **Check Adaptation**: Turn 2 question automatically adapts based on answer quality. Because Turn 1 demonstrated high technical accuracy, the planner triggers a `deepen` action into vector index configuration or quantization.

### 7. Inspect "Why This Question?" Adaptive Context
- Look at the sidebar card labeled **Why This Question?**.
- **Observe**: Displays safe, human-readable adaptive context (e.g., *"Deepening probe based on strong performance in Embeddings Explained"*).
- **Verify Privacy**: Confirm zero raw LLM prompts, internal numeric weights, or internal system instructions are exposed to the candidate.

### 8. Session Persistence & Reload Recovery
- Press `Cmd + R` (or `F5`) to hard-refresh the browser page.
- **Observe**: The session reloads seamlessly at Turn 2 with all answered turns, questions, and active state preserved.
- **Backend Verification**: State is backed by **Neon PostgreSQL** and loaded via parameterized query (`GET /api/interview/session?id=<uuid>`).

### 9. Complete Interview / Advance Turns
- Continue answering technical questions until reaching **8 turns** across **at least 4 curriculum days**.
- *(Alternatively, for rapid judge testing, submit 8 quick turns or query a pre-completed test session).*
- **Completion Trigger**: Once turn 8 is submitted, InterviewOS automatically triggers final report generation and transitions status to `completed`.

### 10. Inspect Executive Competency Report (`/report`)
- The UI transitions to the **Executive Interview Report**.
- **Observe**:
  - Overall Score (0–100) & Competency Level (e.g., `Advanced`).
  - Radar chart / progress bars for 5 competency dimensions: *Correctness*, *Depth*, *Communication*, *Problem Solving*, *Curriculum Alignment*.
  - **Verify Math**: Scores are computed strictly from observed evidence items, not background priors.

### 11. Review "How InterviewOS Adapted" & Turn Replay
- Scroll to **How InterviewOS Adapted**.
- **Observe**: A summary breakdown showing how many turns were `Deepen`, `Clarify`, `Challenge`, or `Rescue`.
- Scroll to **Interview Replay Timeline**.
- **Observe**: A complete step-by-step turn transcript showing every question, candidate response, topic tag, difficulty level, and linked evidence items (`ev_1`, `ev_2`).

### 12. Production Security & Debug Route Protection Test
- Open a new browser tab and navigate to `https://interviewos-vicodathon.vercel.app/api/debug/interview`.
- **Observe**: Returns HTTP **404 Not Found** (`{ "success": false, "error": "NOT_FOUND" }`).
- **Verify Security**: All 13 developer inspection endpoints are strictly blocked in production.

---

## 🚀 Official API Contract Testing via Curl

Judges can also verify InterviewOS programmatically via HTTP:

```bash
# Initialize Session
curl -X POST https://interviewos-vicodathon.vercel.app/api/interview \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "CAND-003"}'

# Submit Turn Answer
curl -X POST https://interviewos-vicodathon.vercel.app/api/interview \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<YOUR_SESSION_ID>",
    "questionId": "<YOUR_QUESTION_ID>",
    "answer": "HNSW index parameters M and efConstruction control graph connectivity and search accuracy."
  }'
```
