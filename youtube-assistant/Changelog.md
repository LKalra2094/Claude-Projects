# Changelog

**Created**: March 2026
**Status**: In Progress

---

## Iteration 8 — Dark Mode, Sign-out Confirmation, Admin Analytics (March 2026)

- Add dark mode with system/light/dark toggle via CSS variable overrides
- Blocking inline script prevents flash of wrong theme on page load
- Sign-out confirmation dialog prevents accidental sign-outs
- New admin per-user analytics table showing searches, clicks, and feedback per user
- New /api/admin/user-stats endpoint with parallel DB queries
- Sign-in page respects dark mode (CSS variables replace hardcoded colors)
- Skeleton loading animation uses CSS variables for dark mode compatibility
- Backlog items #23 (dark mode), #24 (sign-out confirmation), #25 (admin analytics) resolved

## Iteration 7 — Authentication & Per-User Data (March 2026)

- Add Google sign-in via Auth.js v5 (NextAuth) with JWT sessions
- Create sign-in page with Google OAuth button
- Edge-compatible middleware redirects unauthenticated users to sign-in
- Create users table, upsert user on every sign-in
- Add user_id column to query_history, feedback, click_events, ranking_weights
- Migrate historical data to admin's user_id
- All API routes extract session user and filter data by user_id
- Admin tab shows user picker to view/manage any user's weights
- Admin tab restricted to ADMIN_EMAIL; non-admins see only Search + Analytics
- User avatar, name, and sign-out button in header
- Backlog items #21 (auth) and #22 (per-user quota dependency) resolved

## Iteration 6 — UI Polish (March 2026)

- Display 5 videos per row on desktop (3 tablet, 1 mobile) with responsive grid
- Limit search results to top 20
- Persist analytics time period selection across tab switches

## Iteration 5 — Adaptive Ranking Weights (March 2026)

- Add ML-based weight learning via logistic regression (TypeScript, no external libraries)
- Store normalized signals in feedback table for training data
- Create ranking_weights table for learned weight persistence
- New Admin tab: weight visualization, training stats, dry-run preview, revert to defaults
- API endpoints for weight retrieval and model training
- Safeguards: 30-sample minimum, validation holdout, weight bounds [0.03, 0.50]

## Iteration 4 — Ranking Improvements (March 2026)

- Add YouTube's native relevance ranking as a new signal (25% weight)
- Boost semantic similarity to 25%, reduce freshness to 8%
- Equalize subscriber count, view count, and comment density at 14% each
- Add "YouTube Rank" to score breakdown tooltip

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
