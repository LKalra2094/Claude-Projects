# Future Work Tracker

**Created**: February 2026
**Status**: In Progress

---

Running backlog of all planned work beyond Iteration 1. Update **Target** and **Status** as iterations are planned. Items move from "Later" to a specific iteration when scoped.

## Backlog

| # | Item | Category | Target | Status | Notes |
|---|------|----------|--------|--------|-------|
| 1 | Semantic similarity for Query-Description matching | Ranking | Iteration 2 | Pending | Replace keyword overlap with local embedding model (`@xenova/transformers`). No API needed. Biggest ranking quality improvement. |
| 2 | Comment sentiment analysis | Ranking | Iteration 2 | Pending | Requires Claude API. Score comment tone to filter negative sentiment as a quality signal. |
| 3 | Video duration filter UI | Feature | Iteration 2 | Pending | Min/max length controls in Query Zone. Data already supports it — just needs UI + filter logic. |
| 4 | Query history UI | Feature | Iteration 2 | Pending | Data is already being logged to storage.json. Needs a dropdown or history panel to revisit past searches. |
| 5 | ML-based weight adjustment | Ranking | Later | Pending | Use accumulated feedback data to auto-tune signal weights. Needs enough feedback data first. |
| 6 | Channel reputation scoring | Ranking | Later | Pending | Score channels based on historical video quality across multiple videos. Needs data accumulation. |
| 7 | Voice-to-text transcription → Obsidian | Feature | Later | Pending | Transcribe watched videos and save as markdown files to Obsidian vault. |
| 8 | Re-evaluate like-to-view ratio | Ranking | Later | Pending | Dropped in Iteration 1 because `likeCount` is unreliable. Re-check if data improves. |
| 9 | Separate backend server | Infrastructure | Later | Pending | Currently using Next.js API routes. Extract to standalone backend if app grows. |
| 10 | Authentication / deployment | Infrastructure | Later | Pending | Not needed while single-user local tool. Revisit if sharing or deploying. |
