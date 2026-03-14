# YouTube Assistant — Iteration 3 Implementation Plan

**Created**: March 2026
**Status**: Closed

---

## Scope Summary

Backend migration and deployment. Three changes:
1. **Database**: Replace local JSON file (`storage.json`) with PostgreSQL hosted on Neon.
2. **Embeddings**: Replace local ML model (`@xenova/transformers`) with Cohere Embed v3 API.
3. **Deployment**: Deploy to Vercel. App becomes accessible at a public URL.

No UI changes. No new features. The app should look and behave identically to the user — only the infrastructure underneath changes.

---

## Why This Iteration

The app currently only works on your laptop. It reads/writes a local JSON file and loads a 90MB ML model from disk. Neither of these works in production:
- Vercel (serverless) has no persistent filesystem — `storage.json` gets wiped on every deploy.
- Vercel has a 50MB function size limit — the 90MB ML model can't ship with the code.

After this iteration, the app runs at a public URL, data persists in a real database, and embeddings come from a hosted API. The ML model is deleted from the project.

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel (free hobby tier) | Native Next.js support, auto-deploys from GitHub, scales automatically. |
| Database | Neon PostgreSQL (free tier, 500MB) | Serverless PostgreSQL, designed for Vercel. No credit card to start. |
| PG client | `pg` (node-postgres) | Simple, well-known. No ORM needed — schema is 4 tables with straightforward queries. |
| Embeddings API | Cohere Embed v3 (`embed-english-v3.0`) | Free trial tier. Better quality than local MiniLM model. 1024-dimension vectors. |
| Cohere SDK | `cohere-ai` (official Node.js SDK) | Type-safe, maintained by Cohere. |

---

## Cohere Embed v3

### How It Works

Replaces the local `@xenova/transformers` model entirely. Instead of loading a 90MB model into memory and encoding text locally, the app sends text to Cohere's API and gets back embedding vectors.

### API Usage Per Search

Each search makes **2 Cohere API calls**:
1. Encode the user's query (1 text, `input_type: search_query`)
2. Encode all video descriptions in one batch (up to 50 texts, `input_type: search_document`)

Cohere v3 uses different `input_type` values for queries vs documents to improve retrieval quality. This is why we can't combine them into one call.

### Rate Limits (Trial Tier)

Cohere trial API keys have rate limits. Verify exact limits when signing up. For personal use (a few searches per day), the trial tier is sufficient. If limits prove too tight, Cohere's production tier is pay-as-you-go with generous free credits.

### Quality vs Local Model

| | Local (MiniLM-L6-v2) | Cohere Embed v3 |
|--|----------------------|-----------------|
| Vector dimensions | 384 | 1024 |
| Model size | ~90MB | Hosted (0MB local) |
| Quality | Good | Better |
| Speed | ~1-3s first load, ~200ms cached | ~100-300ms per API call |
| Offline support | Yes | No |

---

## Database Schema

Four tables, one per existing data type. Matches the TypeScript types exactly.

```sql
CREATE TABLE IF NOT EXISTS query_history (
  query_id     TEXT        PRIMARY KEY,
  query        TEXT        NOT NULL,
  executed_at  TIMESTAMPTZ NOT NULL,
  result_count INTEGER     NOT NULL,
  top_videos   TEXT[]      NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id              SERIAL           PRIMARY KEY,
  query_id        TEXT             NOT NULL,
  video_id        TEXT             NOT NULL,
  feedback        TEXT             NOT NULL
    CHECK (feedback IN ('thumbs_up', 'thumbs_down', 'none')),
  composite_score DOUBLE PRECISION NOT NULL,
  raw_signals     JSONB            NOT NULL,
  feedback_at     TIMESTAMPTZ      NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_query_video
  ON feedback (query_id, video_id);

CREATE TABLE IF NOT EXISTS click_events (
  id           SERIAL      PRIMARY KEY,
  query_id     TEXT        NOT NULL,
  video_id     TEXT        NOT NULL,
  clicked_rank INTEGER     NOT NULL,
  clicked_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_click_events_query_id
  ON click_events (query_id);

CREATE TABLE IF NOT EXISTS quota_log (
  date        DATE    PRIMARY KEY,
  units_used  INTEGER NOT NULL DEFAULT 0
);
```

**Design notes:**
- `query_history.query_id` is already a unique generated ID — natural primary key.
- `feedback` and `click_events` use surrogate `SERIAL` PKs. Append-only tables with no natural unique key.
- `feedback.raw_signals` stored as `JSONB` — avoids 5 extra columns, remains queryable.
- `quota_log.date` is a natural PK — one row per calendar day, upserted on each search.
- Indexes on `feedback(query_id, video_id)` and `click_events(query_id)` support analytics queries.

---

## Storage Layer Rewrite

Every function in `storage.ts` keeps its **exact signature** — only internals change from JSON file I/O to SQL queries. All functions become `async` (return `Promise`).

| Function | Current (JSON) | New (PostgreSQL) |
|----------|---------------|-----------------|
| `generateQueryId()` | Random string | Unchanged (pure function) |
| `addQueryHistory(entry)` | Read file → append → write file | `INSERT INTO query_history` |
| `addFeedback(entry)` | Read file → append → write file | `INSERT INTO feedback` |
| `getLatestFeedback(qId, vId)` | Filter array, find latest | `SELECT ... ORDER BY feedback_at DESC LIMIT 1` |
| `addClickEvent(event)` | Read file → append → write file | `INSERT INTO click_events` |
| `incrementQuota(units)` | Read file → find/create entry → write file | `INSERT ... ON CONFLICT DO UPDATE` (atomic upsert) |
| `getTodayQuota()` | Read file → find today's entry | `SELECT ... WHERE date = $1` |
| `readStorage()` | Read entire JSON file | **Removed** — only used by analytics route |
| `writeStorage()` | Write entire JSON file | **Removed** |

**Key detail — JSONB round-trip:** When inserting `raw_signals`, pass `JSON.stringify(entry.rawSignals)`. When reading back, `pg` auto-parses JSONB into a JavaScript object — do not call `JSON.parse()` again.

**Key detail — timestamps:** `pg` returns `Date` objects for `TIMESTAMPTZ` columns. Call `.toISOString()` when mapping back to the TypeScript types that expect ISO string format.

---

## Analytics Route Rewrite

The analytics route currently calls `readStorage()` to load all data into memory, then aggregates in TypeScript. With PostgreSQL, we replace the bulk load with 4 targeted SQL queries:

```sql
-- 1. Queries in date range
SELECT query_id, executed_at::date AS date
FROM query_history
WHERE executed_at::date >= $1 AND executed_at::date <= $2;

-- 2. Latest feedback per (query_id, video_id) — deduplication
SELECT DISTINCT ON (query_id, video_id)
  query_id, video_id, feedback
FROM feedback
WHERE feedback_at::date >= $1 AND feedback_at::date <= $2
ORDER BY query_id, video_id, feedback_at DESC;

-- 3. Click counts per query
SELECT query_id, COUNT(*) AS click_count
FROM click_events
WHERE clicked_at::date >= $1 AND clicked_at::date <= $2
GROUP BY query_id;

-- 4. Quota log
SELECT date, units_used
FROM quota_log
WHERE date >= $1 AND date <= $2;
```

The date-range generation, time-series aggregation, and response shaping logic stays unchanged. Only the data source changes from `readStorage()` to SQL result rows.

---

## Type Definition Changes

### Add `tags` to `YouTubeVideoDetails`

The YouTube API returns `snippet.tags` as an optional string array. Our ranking code (updated earlier) already reads `video.snippet.tags`, but the type doesn't include it.

```typescript
// Add to YouTubeVideoDetails.snippet:
tags?: string[];
```

### Update `StorageData` comment

Change the section header comment from "Storage Types (JSON file schema)" to "Storage Types" since it's no longer JSON-backed.

---

## Project Structure Changes

### New Files

```
Application/
├── src/
│   └── lib/
│       └── db.ts                 # PostgreSQL connection pool (singleton)
└── scripts/
    └── migrate.js                # One-time database table creation
```

### Changed Files

```
Application/
├── package.json                  # Add pg, @types/pg, cohere-ai. Remove @xenova/transformers.
├── .env.local                    # Add DATABASE_URL, COHERE_API_KEY (gitignored)
├── .gitignore                    # Remove models/ entry (no longer needed)
└── src/
    ├── types/
    │   └── index.ts              # Add tags to YouTubeVideoDetails
    ├── services/
    │   ├── storage.ts            # Full rewrite: JSON → PostgreSQL
    │   └── embeddings.ts         # Full rewrite: @xenova → Cohere API
    └── app/
        └── api/
            ├── search/route.ts   # Add await to storage calls
            ├── feedback/route.ts # Add await to storage calls
            ├── click/route.ts    # Add await to storage calls
            ├── quota/route.ts    # Add await to storage calls
            └── analytics/route.ts # Replace readStorage() with SQL queries
```

### Deleted Files/Folders

```
Application/
├── models/                       # Entire folder (90MB ML model, no longer needed)
└── scripts/
    └── download-model.js         # No longer needed
```

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `YOUTUBE_API_KEY` | Already exists in `.env.local` | YouTube Data API v3 |
| `DATABASE_URL` | New — `.env.local` + Vercel env vars | Neon PostgreSQL connection string |
| `COHERE_API_KEY` | New — `.env.local` + Vercel env vars | Cohere Embed API |

---

## Build Order

### Phase 0: Setup (accounts + dependencies)

| Step | What | How |
|------|------|-----|
| 0a | Create Neon account | Sign up at neon.tech. Create a project. Copy `DATABASE_URL`. |
| 0b | Create Cohere account | Sign up at cohere.com. Get trial API key from dashboard. |
| 0c | Install new packages | `npm install pg cohere-ai` and `npm install -D @types/pg` |
| 0d | Remove old package | `npm uninstall @xenova/transformers` |
| 0e | Add env vars to `.env.local` | `DATABASE_URL=<neon-url>` and `COHERE_API_KEY=<key>` |

### Phase 1: Database

| Step | What | Why |
|------|------|-----|
| 1a | `scripts/migrate.js` | Create all 4 tables + indexes. Run once against Neon. Verify tables exist. |
| 1b | `src/lib/db.ts` | Singleton connection pool. Test by importing and running a simple query. |
| 1c | `src/services/storage.ts` | Full rewrite. All functions async, all using SQL. Test each function individually. |
| 1d | `src/types/index.ts` | Add `tags?: string[]` to `YouTubeVideoDetails.snippet`. |
| 1e | Update API routes | Add `await` to all storage function calls in `search`, `feedback`, `click`, `quota` routes. |
| 1f | `src/app/api/analytics/route.ts` | Replace `readStorage()` with 4 SQL queries. Keep all aggregation logic. |
| 1g | Test locally | Run `npm run dev`. Do a search, click, give feedback. Check Neon dashboard for rows. Check analytics tab. |

### Phase 2: Embeddings

| Step | What | Why |
|------|------|-----|
| 2a | `src/services/embeddings.ts` | Full rewrite. Replace @xenova with Cohere API calls. Keep `cosineSimilarity` and `calculateSemanticSimilarities` signatures. |
| 2b | Test locally | Do a search. Verify results still rank sensibly. Check Cohere dashboard for API usage. |
| 2c | Clean up | Delete `models/` folder and `scripts/download-model.js`. Update `.gitignore`. |

### Phase 3: Deployment

| Step | What | Why |
|------|------|-----|
| 3a | Push to GitHub | Ensure code is committed and pushed. |
| 3b | Create Vercel project | Connect GitHub repo. Vercel auto-detects Next.js. |
| 3c | Set environment variables | Add `YOUTUBE_API_KEY`, `DATABASE_URL`, `COHERE_API_KEY` in Vercel project settings. |
| 3d | Deploy | Vercel builds and deploys automatically. |
| 3e | Verify | Test search, click, feedback, analytics on the live URL. |

---

## Edge Cases

| Case | How |
|------|-----|
| `DATABASE_URL` not set | `db.ts` throws immediately on import with clear error message. |
| `COHERE_API_KEY` not set | `embeddings.ts` throws on first embed call with clear error message. |
| Cohere API rate limit hit | Return error to frontend. UI shows existing ErrorState. |
| Cohere API down | Same as rate limit — search fails, error surfaced to user. |
| Neon database unreachable | Storage functions throw. API routes catch and return 500. |
| Empty video description | Send as-is to Cohere (handles empty strings gracefully). Falls back to title + tags. |
| `raw_signals` JSONB parsing | `pg` auto-parses on read. Do not double-parse. On write, always `JSON.stringify()`. |
| TIMESTAMPTZ → ISO string | `pg` returns `Date` objects. Call `.toISOString()` in all row-to-type mappings. |
| Concurrent quota updates | `INSERT ... ON CONFLICT DO UPDATE` is atomic — no race condition (improvement over JSON). |
| First deploy with empty database | App works fine — no searches, analytics shows empty state. |
| Existing `storage.json` data | Not migrated. Starting fresh in production. Local JSON file ignored. |

---

## What This Does NOT Include (Iteration 4+)

- Authentication or multi-user support
- Data migration from local `storage.json` to PostgreSQL
- Comment sentiment analysis
- Voice-to-text / Obsidian integration
- UI changes or new features
- Remaining backlog items (#9, #10, #11, #12, #15, #17)
