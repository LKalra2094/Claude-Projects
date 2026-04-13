# AI Nanny — Children's Q&A Agent

**Created**: April 2026
**Status**: In Progress

---

## Role Context

A children's Q&A web app. A child speaks a question, it's transcribed, an LLM generates a child-friendly answer (enriched with web search), and the answer is spoken back in the parent's cloned voice using ElevenLabs.

Originally built at a hackathon, now being developed as a full product with no time pressure.

## Project Location Rule

All project files live inside `Claude Projects/AI Nanny/`. Source code lives in `app/` (Next.js project). The `app/` folder is also a separate git repo pushed to `LKalra2094/parent-voice-qa` on GitHub and deployed to Vercel.

## Context Reading Order

1. `CLAUDE.md` (this file)
2. `Session Status.md`
3. `Product Requirements/AI Nanny - Product Brief.md`
4. `Product Requirements/AI Nanny - Product Requirements Document.md`
5. `Product Backlog.md`

## Session Protocols

Follow the Start/End of Session protocols defined in the root `CLAUDE.md`.

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js (React) | Built in-house, same repo as backend |
| Backend | Next.js (API routes) | Single repo, deploys to Vercel |
| Voice Clone | ElevenLabs Clone Voice API | Best-in-class cloning |
| STT | ElevenLabs Scribe | High quality, consistent vendor |
| LLM | Groq (Llama 3.3 70B) | Free tier, extremely fast |
| Web Search | Exa Search API | Semantic search, free tier |
| TTS | ElevenLabs TTS (Flash v2.5) | Low latency, uses cloned voice |
| Hosting | Vercel | Auto-deploy from GitHub |

## API Endpoints

| Endpoint | Input | Pipeline | Latency |
|----------|-------|----------|---------|
| `POST /api/ask` | Audio file + history JSON | STT → Exa → LLM → TTS | ~4-6s |
| `POST /api/ask-text` | Text + history JSON | Exa → LLM → TTS | ~2-3s |

## Sprints

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Backend API pipeline + deployment | Closed |
| Sprint 2 | Exa search + conversation memory | Closed |
| Sprint 3 | Frontend integration + polish | Cancelled (hackathon scope) |
| Sprint 4 | LLM soul document + minimal frontend | Closed |
| Sprint 5 | Persist Q&A to database (Neon) | Closed |

## References

- **Product Backlog**: `Product Backlog.md`
- **GitHub Repo**: https://github.com/LKalra2094/parent-voice-qa
- **Vercel Deployment**: parent-voice-qa.vercel.app
