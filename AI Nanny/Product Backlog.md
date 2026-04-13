# Product Backlog

**Created**: April 2026
**Status**: In Progress

---

| # | Item | User Journey Phase | Priority | Status | Dependencies | Notes | Shipped In |
|---|------|--------------------|----------|--------|--------------|-------|------------|
| 1 | Voice cloning setup (manual via ElevenLabs dashboard) | Voice Setup | P0 | Done | — | Parent records voice, gets voice_id | Pre-sprint |
| 2 | Backend STT → LLM → TTS pipeline | Child Q&A | P0 | Done | US-1 | POST /api/ask endpoint | Sprint 1 |
| 3 | CORS middleware for cross-origin frontend | Child Q&A | P0 | Done | — | Allows Lovable domain to call API | Sprint 1 |
| 4 | Vercel deployment | Child Q&A | P0 | Done | #2, #3 | Live at parent-voice-qa.vercel.app | Sprint 1 |
| 5 | Exa web search integration | Safety & Search | P1 | Done | #2 | Enriches LLM with factual context | Sprint 2 |
| 6 | Conversation memory (client-side history) | Child Q&A | P1 | Done | #2 | Last 10 messages sent per request | Sprint 2 |
| 7 | Text-only endpoint (/api/ask-text) | Child Q&A | P2 | Done | #2 | Faster path if frontend handles STT | Sprint 2 |
| 8 | ~~Frontend mic recording + playback (Lovable)~~ | Child Q&A | — | Cancelled | — | Hackathon scope, replaced by #13 | — |
| 9 | ~~Frontend-backend integration testing~~ | Child Q&A | — | Cancelled | — | Hackathon scope | — |
| 10 | ~~Demo polish + rehearsal~~ | — | — | Cancelled | — | Hackathon scope | — |
| 11 | LLM soul document (personality, tone, edge cases) | Child Q&A | P0 | Done | #2 | Rich prompt defining how AI Nanny speaks to children | Sprint 4 |
| 12 | Persist Q&A to database (analytics foundation) | Parent Analytics | P1 | Done | #2 | Save every question + answer for parent review | Sprint 5 |
| 13 | Frontend (mic, playback, conversation UI) | Child Q&A | P1 | Pending | #2 | Build from scratch in Next.js, replacing Lovable | — |
| 14 | Parent auth (login/signup) | Parent Analytics | P1 | Pending | — | Required before analytics dashboard | — |
| 15 | Parent analytics dashboard | Parent Analytics | P2 | Pending | #12, #14 | View child's questions, topics, activity | — |
| 16 | Soul document iteration (brevity + vocabulary) | Child Q&A | P1 | Pending | #11 | Llama 3.3 responses too long and vocabulary too advanced for young children | — |
