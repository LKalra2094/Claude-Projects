# Changelog

**Created**: March 2026
**Status**: In Progress

---

## Iteration 3 — Backend Migration & Deployment (March 2026)

Infrastructure-only release. No UI changes.

- Migrate storage from local JSON to Neon PostgreSQL (4 tables, atomic upserts)
- Replace local MiniLM-L6-v2 model with Cohere Embed v3 API (1024-dim vectors)
- Deploy to Vercel with auto-deploys from GitHub
- Rename project folder for Vercel compatibility (`Youtube Assistant` → `youtube-assistant`)
- Fix UTC timezone handling for analytics date aggregation
- Delete local ML model (~90MB) and download script

## Iteration 2 — Semantic Search & Analytics (February 2026)

- Add semantic search using local embedding model (`@xenova/transformers`, MiniLM-L6-v2)
- Replace keyword overlap with cosine similarity on title + description + tags
- Add Analytics tab with 5 charts: searches/day, null search %, thumbs up/down, clicks/search, API units
- Add time period selector (7D, 30D, 90D, All)
- Add summary row with period averages
- Add analytics loading state (skeleton/spinner)
- Add analytics error handling for corrupted data

## Iteration 1 — Core App (January 2026)

- Next.js app with YouTube Data API v3 integration
- Multi-signal ranking algorithm: comment density, subscriber count, query-description overlap, view count, freshness
- Pre-ranking filters: made-for-kids, live streams, shorts (<2 min)
- Search UI with query input, 5x2 results grid, video cards with thumbnails and stats
- Thumbs up/down feedback with reversibility
- Click tracking with rank position logging
- Daily API quota tracking with usage bar
- Score breakdown tooltip on hover
- Loading skeletons and error states
