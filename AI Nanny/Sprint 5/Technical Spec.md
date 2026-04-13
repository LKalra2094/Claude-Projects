# Sprint 5 — Technical Spec

**Created**: April 2026
**Status**: Closed

---

## Focus

Persist Q&A to Database (#12) — Add Neon backend to store every interaction with full pipeline context, tied to child profiles.

## Stories Delivered

All stories from `Epics/US-12 - Persist QA to Database.md` (12.1 through 12.5).

## Problem

Currently nothing is persisted. Every question and answer disappears after the response is played. This blocks:
- Parent analytics (can't show what the child asked)
- LLM improvement (can't review answer quality)
- Multi-child support (can't attribute questions to a child)

## Schema

### `kids`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | Auto-generated |
| `parent_id` | text | Placeholder for now, becomes FK to auth users later |
| `name` | text, not null | Display name |
| `age` | int | Child's age |
| `gender` | text | Child's gender |
| `created_at` | timestamptz | Auto-set |

### `interactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | Auto-generated |
| `parent_id` | text | Same placeholder as kids table |
| `kid_id` | uuid, FK → kids.id | Which child asked |
| `conversation_id` | uuid | Groups messages into sessions, generated client-side |
| `question` | text, not null | Transcribed text |
| `answer` | text, not null | LLM response |
| `search_context` | text | Exa results fed to LLM, nullable |
| `response_latency_ms` | int | Full pipeline time |
| `created_at` | timestamptz | Auto-set |

## Scope

### What changes

| File | Change |
|------|--------|
| `app/app/lib/supabase.ts` | New — Neon client setup |
| `app/app/lib/pipeline.ts` | Add interaction logging after TTS, measure latency, accept kid_id and conversation_id |
| `app/app/api/ask/route.ts` | Pass kid_id and conversation_id from request to pipeline |
| `app/app/api/ask-text/route.ts` | Same as above |
| `app/app/api/kids/route.ts` | New — CRUD for kid profiles |
| `app/app/page.tsx` | Add kid selector and generate conversation_id per session |
| `package.json` | Add `@supabase/supabase-js` dependency |

### What doesn't change

- Soul document / system prompt unchanged
- ElevenLabs STT/TTS pipeline unchanged
- Exa search unchanged
- No auth yet — parent_id is a placeholder

## API Changes

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/kids` | GET | — | List all kid profiles |
| `/api/kids` | POST | `{ name, age, gender }` | Created kid object |
| `/api/ask` | POST | Adds `kid_id`, `conversation_id` to form data | Unchanged (audio/mpeg) |
| `/api/ask-text` | POST | Adds `kid_id`, `conversation_id` to JSON body | Unchanged (audio/mpeg) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |

## Risks

| Risk | Mitigation |
|------|------------|
| DB insert adds latency to response | Insert async (don't await before returning audio) |
| No auth means anyone with the URL can create kids/interactions | Acceptable for now; auth is Sprint 6+ |
| Schema migration needed later when auth is added | parent_id is text, easy to migrate to FK |
