# Backlog

**Created**: February 2026
**Status**: In Progress

---

Running backlog of all planned work beyond Iteration 1. Update **Status** as items are completed.

| # | Item | Category | Status | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 1 | Comment sentiment analysis | Ranking | Pending | YouTube comments.list API, local LLM (Ollama + Llama/Mistral) | New ranking signal. Keeps cost at zero. |
| 2 | Voice-to-text → Obsidian | Feature | Pending | Local Whisper model, Obsidian vault access | Only for videos with positive feedback AND clicked. Builds personal knowledge base. |
| 3 | Database migration | Infrastructure | Done | PostgreSQL on Neon, `pg` client | Migrated from local JSON to Neon PostgreSQL. 4 tables, atomic upserts, UTC-consistent. |
| 4 | Deployment | Infrastructure | In Progress | Database migration (#3), Vercel | Code ready for Vercel. Env vars set locally. Vercel project creation pending. |
| 5 | Reduce latency | Performance | Pending | TBD | |
| 6 | Improve semantic search model | Ranking | Done | Cohere Embed v3 API | Replaced local MiniLM-L6-v2 with Cohere embed-english-v3.0. 1024-dim vectors, hosted API. |
| 7 | Semantic search model load failure error | Error Handling | N/A | — | Local model removed in Iteration 3. Replaced by Cohere API. No longer applicable. |
| 8 | Local model missing error message | Error Handling | N/A | — | Local model removed in Iteration 3. Replaced by Cohere API. No longer applicable. |
| 9 | Time zone handling for Analytics | Analytics | Done | Analytics tab | Fixed UTC consistency: PostgreSQL session timezone set to UTC, Node.js date functions use UTC methods. No more off-by-one day issues. |
| 10 | Description length truncation | Ranking | Pending | Iteration 2 semantic search | YouTube descriptions can be up to 5,000 chars. Cap to model's max token length before encoding to avoid slow or degraded embeddings. |
| 11 | Query length validation | Ranking | Pending | Iteration 2 semantic search | Very short queries (e.g. single word) may produce weak embeddings. Define a minimum length or surface a hint to the user. |
| 12 | All-time period performance | Performance | Pending | Analytics tab | "All" period scans entire storage.json and returns unbounded daily data points. Aggregate to weekly or monthly for large datasets. |
| 13 | Analytics loading state | UX | Done | Analytics tab | No loading indicator while analytics data is being computed. Add skeleton or spinner before data arrives. |
| 14 | Analytics error states | Error Handling | Done | Analytics tab | No handling for corrupted storage.json or analytics computation failures. Define error state for the Analytics tab. |
| 15 | Analytics tab state persistence | UX | Pending | Analytics tab | Time period selection resets when switching between Search and Analytics tabs. Persist selected period across navigation. |
| 16 | Embedding failure error UX | Error Handling | Pending | Cohere Embed API | Cohere API call fails mid-search (rate limit, downtime, invalid key). Currently fails search and returns to empty state. Add user-friendly error message. |
| 17 | Clicks per non-null searches metric | Analytics | Pending | Analytics tab | Current metric shows avg clicks per search including null searches (no clicks). Change to only count non-null searches in the denominator for more meaningful metric. |
| 18 | Semantic search on title + description + tags | Ranking | Done | Iteration 2 semantic search | Concatenates title, description, and tags before encoding. Improved relevance matching. |
| 19 | 5 videos per row layout | UX | Pending | None | Current layout shows 2 videos per row. Change to 5 videos per row for denser information display. |
| 20 | Define total results display limit | UX | Pending | None | No defined rule for how many total videos to show after scrolling. Define cutoff (e.g., top 20, top 30) or implement pagination/infinite scroll pattern. |
