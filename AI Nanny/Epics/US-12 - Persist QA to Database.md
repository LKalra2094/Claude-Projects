# US-12 — Persist Q&A to Database

**Created**: April 2026
**Status**: Done

---

## Epic Summary

Add a database backend to store every question-answer interaction. This is the foundation for parent analytics, LLM improvement, and multi-child support. Each interaction captures the full pipeline context (question, answer, search results, latency) tied to a specific child profile.

## Stories

| ID | Story | Acceptance Criteria | Status |
|----|-------|---------------------|--------|
| 12.1 | Set up Supabase project and database schema | Tables `kids` and `interactions` created with all columns, RLS policies in place | Done |
| 12.2 | Create `kids` table and kid profile API | POST /api/kids to create a kid profile, GET /api/kids to list them. Fields: id, parent_id, name, age, gender | Done |
| 12.3 | Create `interactions` table and logging | Every /api/ask and /api/ask-text call writes a row with question, answer, search_context, conversation_id, kid_id, response_latency_ms | Done |
| 12.4 | Pass kid_id from frontend to API | Frontend sends kid_id with each request so interactions are attributed to the right child | Done |
| 12.5 | Verify data is stored correctly | Make test requests, confirm rows appear in Supabase dashboard with all fields populated | Done |

## Notes

- Auth (US-14) is not in this sprint. For now, parent_id can be a placeholder or env var. Auth will be layered on later.
- conversation_id is generated client-side (UUID per session) and sent with each request.
