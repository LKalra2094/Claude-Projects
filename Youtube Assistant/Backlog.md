# Backlog

**Created**: February 2026
**Status**: In Progress

---

Running backlog of all planned work beyond Iteration 1. Update **Status** as items are completed.

| # | Item | Category | Status | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 1 | Comment sentiment analysis | Ranking | Pending | YouTube comments.list API, local LLM (Ollama + Llama/Mistral) | New ranking signal. Keeps cost at zero. |
| 2 | Voice-to-text → Obsidian | Feature | Pending | Local Whisper model, Obsidian vault access | Only for videos with positive feedback AND clicked. Builds personal knowledge base. |
| 3 | Database migration | Infrastructure | Pending | PostgreSQL or similar, hosting (Vercel Postgres, Supabase) | Required before deployment — serverless has no persistent filesystem. |
| 4 | Deployment | Infrastructure | Pending | Database migration (#3), Vercel or similar platform | Next.js API routes deploy with front-end. API key moves to env vars. |
| 5 | Reduce latency | Performance | Pending | TBD | |
| 6 | Improve semantic search model | Ranking | Pending | TBD | |
| 7 | Semantic search model load failure error | Error Handling | Pending | Iteration 2 semantic search | Model file exists but fails to load at runtime (corrupted, incompatible, OOM). Surface a user-facing error instead of failing silently. |
| 8 | Local model missing error message | Error Handling | Pending | Iteration 2 semantic search | Model file not found on disk. Distinct from load failure (#7). Show clear message so user knows to re-download. |
| 9 | Time zone handling for Analytics | Analytics | Pending | Analytics tab | Dates in storage.json are UTC. Per-day grouping and chart x-axis labels should use user's local timezone to avoid off-by-one day issues. |
| 10 | Description length truncation | Ranking | Pending | Iteration 2 semantic search | YouTube descriptions can be up to 5,000 chars. Cap to model's max token length before encoding to avoid slow or degraded embeddings. |
| 11 | Query length validation | Ranking | Pending | Iteration 2 semantic search | Very short queries (e.g. single word) may produce weak embeddings. Define a minimum length or surface a hint to the user. |
| 12 | All-time period performance | Performance | Pending | Analytics tab | "All" period scans entire storage.json and returns unbounded daily data points. Aggregate to weekly or monthly for large datasets. |
| 13 | Analytics loading state | UX | Pending | Analytics tab | No loading indicator while analytics data is being computed. Add skeleton or spinner before data arrives. |
| 14 | Analytics error states | Error Handling | Pending | Analytics tab | No handling for corrupted storage.json or analytics computation failures. Define error state for the Analytics tab. |
| 15 | Analytics tab state persistence | UX | Pending | Analytics tab | Time period selection resets when switching between Search and Analytics tabs. Persist selected period across navigation. |
| 16 | Embedding failure error UX | Error Handling | Pending | Iteration 2 semantic search | Model loaded but encoding throws mid-search. Currently fails search and returns to empty state. Add user-friendly error message explaining what happened. |
