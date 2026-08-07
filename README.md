# InterviewOS — AI Technical Interview Agent

InterviewOS is an autonomous, adaptive AI technical interview agent designed for the ViCodathon 2026 Hackathon.

## Official Hackathon HTTP API

### Endpoints
- `POST /api/interview` (Primary)
- `POST /api/agent` (Alias)

### Initialize New Interview Session
```bash
curl -X POST http://localhost:3000/api/interview \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "CAND-003"
  }'
```

**Response Example (Active):**
```json
{
  "sessionId": "session_CAND-003_1770416863",
  "status": "active",
  "turnCount": 1,
  "coveredCurriculumDays": [7],
  "coveredTopics": ["Embeddings Explained"],
  "question": {
    "id": "q_CAND-003_1770416863_b5y07",
    "text": "What is the primary trade-off when configuring HNSW index parameters M and efConstruction?",
    "topic": "Embeddings Explained",
    "curriculumDay": 7,
    "difficulty": "advanced"
  },
  "report": null
}
```

### Continue Interview Session (Submit Candidate Answer)
```bash
curl -X POST http://localhost:3000/api/interview \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_CAND-003_1770416863",
    "questionId": "q_CAND-003_1770416863_b5y07",
    "answer": "Parameter M controls the maximum number of bidirectional connections per node in each layer, while efConstruction controls search depth during graph build time."
  }'
```

**Response Example (Completed Report):**
```json
{
  "sessionId": "session_CAND-003_1770416863",
  "status": "completed",
  "turnCount": 8,
  "coveredCurriculumDays": [7, 8, 9, 10],
  "coveredTopics": ["Embeddings Explained", "Vector Databases", "RAG Architectures", "Hybrid Search & Reranking"],
  "question": null,
  "report": {
    "overallScore": 92,
    "level": "advanced",
    "confidence": 0.88,
    "competencies": {
      "correctness": {
        "score": 3.8,
        "normalizedScore": 95,
        "confidence": 0.9,
        "status": "strong",
        "summary": "Demonstrated high technical accuracy...",
        "evidenceIds": ["ev_1", "ev_2"]
      }
    },
    "strengths": [
      {
        "id": "str_1",
        "title": "HNSW Graph Indexing Mastery",
        "description": "Demonstrated clear understanding of graph connectivity parameters.",
        "topics": ["Embeddings Explained"],
        "evidenceIds": ["ev_1"]
      }
    ],
    "developmentAreas": [],
    "feedback": {
      "summary": "Emily demonstrated advanced technical depth across RAG and vector database architectures.",
      "strongestAreas": ["Vector Indexing", "RAG Pipeline Optimization"],
      "nextSteps": ["Explore quantization compression tradeoffs under extreme scale."]
    }
  }
}
```

## Running & Testing

### Development Server
```bash
npm run dev
```

### Run Full Test Suite (196 tests across 10 suites)
```bash
npm test
```

### Run Contract Test Suite Only
```bash
npm run test:contract
```

### Typecheck & Production Build
```bash
npm run lint
npm run build
```
