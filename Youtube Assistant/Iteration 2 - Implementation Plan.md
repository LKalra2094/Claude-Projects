# YouTube Assistant — Iteration 2 Implementation Plan

**Created**: February 2026
**Status**: In Progress

---

## Scope Summary

Two features: Semantic paragraph search and Analytics tab. Semantic search replaces keyword overlap in the ranking engine with meaning-based matching. Analytics adds a new tab showing usage metrics derived from existing storage data.

---

## Semantic Paragraph Search

### How It Works

Replaces the `calculateOverlap` function in `ranking.ts`. Instead of counting matching keywords between the user's query and video descriptions, both are converted into vectors using a local embedding model, then compared using cosine similarity.

### Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package | `@xenova/transformers` | Runs Hugging Face models in Node.js. No GPU needed, CPU only. |
| Model | `sentence-transformers/all-MiniLM-L6-v2` | ~90MB. Fast on CPU. Good balance of speed and quality for sentence-level similarity. |
| Model storage | `Application/models/Semantic_Search_Model` | Stored locally in the project. Eliminates cloud download entirely. Gitignored — 90MB binary. |
| Model caching | Module-level variable | Model loads once on first request, stays in memory. Avoids re-reading from disk on every search. |
| Similarity metric | Cosine similarity | Standard for comparing embedding vectors. Returns 0–1 score, already normalized. |

### Latency Impact

- Model load (first request only): ~2–3 seconds
- Encoding query + 50 descriptions on CPU: ~1–3 seconds
- Subsequent requests (model cached): ~1–3 seconds total
- User already waits for YouTube API calls (~1–2 seconds), so this stacks on top

---

## Analytics Tab

### Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting library | Recharts | React-native components, simple declarative API, supports bar and line charts. ~45KB gzipped. No D3 knowledge required. |

### Metrics

All metrics are computed from existing data in `storage.json`. No new data collection needed. Per-search metrics are aggregated to daily averages for time series display. All metrics filter to the user-selected time period (7D, 30D, 90D, or All). Default is 7D.

| Metric | Source | Chart |
|--------|--------|-------|
| Searches per day | `queryHistory` — count entries by date | Chart 1 |
| Null searches as % of searches per day | Cross-reference `queryHistory` with `clickEvents` — a search is null if zero click events exist for that `queryId`. Feedback state is irrelevant. Divided by total searches. | Chart 2 |
| Avg thumbs up per search per day | `feedback` — count `thumbs_up` per `queryId`, average across each day | Chart 3 |
| Avg thumbs down per search per day | `feedback` — count `thumbs_down` per `queryId`, average across each day | Chart 3 (overlaid) |
| Avg videos clicked per search per day | `clickEvents` — count per `queryId`, average across each day | Chart 4 |
| API units per day | `quotaLog` — `unitsUsed` per day | Chart 5 |

### UI Layout

Two-tab navigation via hamburger menu (top left): **Search** (default) and **Analytics**. Analytics tab contains:

- **Time period selector** (top right) — dropdown: 7D, 30D, 90D, All. Default 7D. Changing it re-fetches analytics for the new period.
- **Summary row** — averages for the selected period: searches/day, null search %, thumbs up/down per search, clicks per search, API units/day
- **Chart 1** — Searches per day (bar chart)
- **Chart 2** — Null searches as % per day (line chart)
- **Chart 3** — Thumbs up vs thumbs down per search (two overlaid lines)
- **Chart 4** — Videos clicked per search (line chart)
- **Chart 5** — API units per day (bar chart)

### API Route Contract

**GET `/api/analytics`**

Query parameters:
- `period` (required): `"7d"` | `"30d"` | `"90d"` | `"all"` — time window for filtering data

Response:
```json
{
  "period": "7d",
  "summary": {
    "searchesPerDay": 4.2,
    "nullSearchPercent": 18.0,
    "thumbsUpPerSearch": 1.3,
    "thumbsDownPerSearch": 0.4,
    "clicksPerSearch": 2.1,
    "apiUnitsPerDay": 408
  },
  "timeSeries": [
    {
      "date": "2026-02-01",
      "searches": 5,
      "nullSearchPercent": 20.0,
      "thumbsUpPerSearch": 1.2,
      "thumbsDownPerSearch": 0.6,
      "clicksPerSearch": 2.4,
      "apiUnits": 510
    }
  ]
}
```

Notes:
- `timeSeries` array is sorted by date ascending
- Days with no searches are included with all values set to `0`
- `nullSearchPercent` is 0–100, not 0–1
- Summary values are averages across the period (except `nullSearchPercent` which is total null / total searches)

---

## Type Definitions

Add to `types/index.ts`:

```typescript
// ============================================
// Analytics Types
// ============================================

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsSummary {
  searchesPerDay: number;
  nullSearchPercent: number;
  thumbsUpPerSearch: number;
  thumbsDownPerSearch: number;
  clicksPerSearch: number;
  apiUnitsPerDay: number;
}

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD
  searches: number;
  nullSearchPercent: number;
  thumbsUpPerSearch: number;
  thumbsDownPerSearch: number;
  clicksPerSearch: number;
  apiUnits: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesDataPoint[];
}
```

---

## Project Structure Changes

### New Files

```
Application/
├── models/
│   └── Semantic_Search_Model/      # Local embedding model (~90MB). Gitignored.
├── scripts/
│   └── download-model.js           # One-time script to download the embedding model
└── src/
    ├── services/
    │   └── embeddings.ts           # Model loading, text encoding, cosine similarity
    ├── app/
    │   └── api/
    │       └── analytics/route.ts  # GET: compute and return all analytics data
    └── components/
        ├── AnalyticsTab.tsx        # Analytics page layout, composes charts and summary
        └── TimeSeriesChart.tsx     # Reusable time series chart component (used 5x)
```

### Changed Files

```
Application/
├── .gitignore                      # Add models/ folder
└── src/
    ├── types/
    │   └── index.ts                # Add Analytics types (AnalyticsPeriod, AnalyticsSummary, etc.)
    ├── services/
    │   └── ranking.ts              # Replace calculateOverlap with semantic similarity
    └── app/
        └── page.tsx                # Add tab navigation, wire Analytics tab
```

---

## Build Order

### Phase 0: Setup

| Step | What | How |
|------|------|-----|
| 0a | Install packages | `npm install @xenova/transformers recharts` |
| 0b | Download embedding model | Run the download script (see below). Saves to `Application/models/Semantic_Search_Model`. |

**Model download script** (run once from `Application/` directory):
```javascript
// scripts/download-model.js
const { pipeline } = require('@xenova/transformers');

async function downloadModel() {
  console.log('Downloading model (this may take a few minutes)...');
  await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    cache_dir: './models/Semantic_Search_Model',
  });
  console.log('Model downloaded to ./models/Semantic_Search_Model');
}

downloadModel();
```
Run with: `node scripts/download-model.js`

### Phase 1: Code

| Step | What | Why |
|------|------|-----|
| 1 | `types/index.ts` | Define analytics types first. Enables type-safe development for API and frontend in parallel. |
| 2 | `services/embeddings.ts` | Core of semantic search. Build and test independently before touching ranking. |
| 3 | `services/ranking.ts` | Swap `calculateOverlap` with embeddings. Test search results to confirm quality. |
| 4 | `api/analytics/route.ts` | GET with `?period=7d|30d|90d|all`. Compute all metrics filtered to that window. Test via curl before building UI. |
| 5 | `TimeSeriesChart.tsx` | Reusable chart component. Build with hardcoded data matching `TimeSeriesDataPoint` shape. |
| 6 | `AnalyticsTab.tsx` | Compose charts and summary row. Wire to `/api/analytics`. |
| 7 | `page.tsx` | Add tab navigation. Wire both Search and Analytics tabs. |

---

## Edge Cases

| Case                                     | How                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Model missing from local folder          | If `models/Semantic_Search_Model` is missing, fall back to downloading from Hugging Face and saving it there. Log a warning. |
| Empty storage (no searches yet)          | Analytics tab shows empty state: "No data yet. Start searching to see analytics."                                            |
| Zero clicks in a search                  | Null search. The only signal that matters is whether a click event was logged for that `queryId`. Thumbs up/down and tab closing are irrelevant — if no click fired, it's null. Conversely, if a click fired, it's not null regardless of what the user does after (e.g., immediately closing the tab). |
| Time series gaps (days with no searches) | Show as zero, not missing. Keeps the chart continuous.                                                                       |
| Embedding fails at runtime               | Fail the entire search. Return error to frontend. UI returns to empty state (no results). Error messaging UX is backlogged. |
| Empty video description                  | Skip embedding entirely. Normalized score is 0. No calculation attempted.                                                    |
| Very short video descriptions            | Non-empty short descriptions still go through embedding. Cosine similarity degrades gracefully with less text, doesn't break. |
| Selected period has less data than window | e.g., user selects 90D but only 2 days of data exist. Charts show what's available, no error. Time series starts from first data point. |
