# YouTube Assistant — Iteration 1 Implementation Plan

## Scope Summary
A local Next.js web app. No Claude API. No separate backend server. No auth. Single user.
YouTube API is the only external dependency. Feedback and query history stored in a local JSON file.

---

## likeCount Discovery and Decision
YouTube removed public like counts in Nov 2021. The `statistics.likeCount` field is unreliable — may return a value, `0`, or be omitted entirely. **Decision: drop like-to-view ratio entirely.** Weights redistributed across the remaining signals.

---

## Tech Decisions
| Decision           | Choice                                                | Rationale                                                                                           |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Framework          | Next.js (App Router)                                  | API routes give us a backend without a separate server. Extractable later.                          |
| Sentiment analysis | Out of scope (Iteration 2)                            | Keeps it simple, no Claude API dependency                                                           |
| Storage            | Local JSON file (`src/data/storage.json`)             | Zero dependencies, easy to migrate to DB in Iteration 2                                             |
| YouTube API key    | `.env.local`, server-only                             | Never exposed to browser. Next.js enforces this automatically.                                      |
| Candidate count    | Fetch 50, display top 10 in 5x2 grid, scroll for rest | `search.list` costs 100 units regardless of result count (5–50). 50 gives the ranker enough spread. |

---

## Quota Math
| Call | Units | Notes |
|---|---|---|
| `search.list` | 100 | Per call. The expensive one. |
| `videos.list` | 1 | Batch up to 50 IDs in one call |
| `channels.list` | 1 | Batch up to 50 IDs in one call |
| **Total per search** | **102** | |
| **Daily free limit** | **10,000** | ~98 searches/day. Fine for single user. |

---

## Project Structure
```
youtube-assistant/Application/
├── .env.local                          # YOUTUBE_API_KEY (gitignored)
├── next.config.js
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, global styles
│   │   ├── page.tsx                    # App shell, top-level state, composes all zones
│   │   └── api/
│   │       ├── search/route.ts         # POST: search → fetch details → rank → return
│   │       ├── feedback/route.ts       # POST: append thumbs up/down to JSON
│   │       ├── click/route.ts          # POST: log click event (videoId, rank) to JSON
│   │       └── quota/route.ts          # GET: read today's quota usage from JSON
│   ├── components/
│   │   ├── QueryZone.tsx               # Text input + Find Videos button (disabled while loading)
│   │   ├── ResultsGrid.tsx             # 5x2 CSS grid, scrollable overflow
│   │   ├── VideoCard.tsx               # Card: thumbnail, stats, score, thumbs
│   │   ├── LoadingState.tsx            # Skeleton cards (pulsing placeholders) while API runs
│   │   ├── ErrorState.tsx              # Error banner: API failure (+ Try Again) or zero results
│   │   ├── StatusFooter.tsx            # Quota usage bar
│   │   └── ScoreBreakdown.tsx          # Hover tooltip: per-signal score breakdown
│   ├── services/
│   │   ├── youtube.ts                  # All YouTube API calls (search, videos, channels)
│   │   ├── ranking.ts                  # Signal extraction, normalization, scoring
│   │   └── storage.ts                  # Read/write local JSON (sync fs)
│   ├── types/
│   │   └── index.ts                    # All shared TypeScript interfaces
│   └── data/
│       └── storage.json                # Persisted data (gitignored)
├── .gitignore                          # .env.local, src/data/, node_modules/, .next/
└── README.md
```

---

## Ranking Algorithm
Three stages: extract raw signals → normalize to 0–1 → weight and sum.

### Pre-Ranking Filter
Before scoring, filter out videos that don't fit the educational use case. These are removed from the candidate list entirely and never ranked or displayed.

| Condition | Field | Rationale |
|-----------|-------|----------|
| Made for kids | `status.madeForKids === true` | Children's content, not target audience |
| Live stream | `snippet.liveBroadcastContent !== "none"` | Live/upcoming streams aren't structured learning content |
| Too short | `contentDetails.duration` < 2 minutes | Filters out YouTube Shorts and superficial content |

### Signals and Weights
| Signal                    | Raw Source                                            | Normalization                            | Weight |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------- | ------ |
| Comment Density           | `commentCount / viewCount`                            | Min-max across candidate batch           | 0.20   |
| Subscriber Count          | `channel.subscriberCount`                             | Log scale: `log10(count+1) / log10(50M)` | 0.20   |
| Query-Description Overlap | Keyword overlap (user query vs `snippet.description`) | Already 0–1 from overlap function        | 0.20   |
| View Count                | `statistics.viewCount`                                | Log scale: `log10(count+1) / log10(1B)`  | 0.20   |
| Freshness                 | `snippet.publishedAt`                                 | Recency decay (see below)                | 0.20   |

**Query-Description Overlap detail:** Tokenize both the user's search query and the video's `snippet.description`, remove stopwords, compute `|intersection(queryTokens, descriptionTokens)| / |queryTokens|`. High overlap = video description actually covers what the user is looking for. Low overlap = video is not relevant to the query.

**View Count detail:** Log scale normalization (`log10(viewCount+1) / log10(1,000,000,000)`) prevents a video with 500M views from completely dominating. Note: this is a popularity signal — the other signals are quality/relevance signals. The 0.20 weight keeps it from overpowering the ranking but it will still lift well-watched videos.

**Freshness detail:** Recency decay using the formula: `max(0, 1 - (daysSincePublished / 3650))` where 3650 = 10 years. A video published today scores 1.0, a video from 2.5 years ago scores 0.25, and anything 10+ years old scores 0. This prevents stale content from ranking highly for fast-moving topics while still allowing classic content to rank if other signals are strong (since Freshness is only 20% of the score).

**Notes:**
- Like-to-view ratio was dropped due to `likeCount` being unreliable in the YouTube API. Can be re-added in a future iteration if the data proves available for enough videos.
- Query-Description Overlap uses simple keyword matching in Iteration 1. A future iteration will replace this with semantic similarity using a local embedding model (`@xenova/transformers` in Node.js) — no API needed, but gives real meaning-based matching instead of exact word matching.

---

## JSON Storage Schema
```json
{
  "queryHistory": [
    {
      "queryId": "q_a1b2c3d4",
      "query": "how transformers work",
      "executedAt": "2026-02-03T14:32:00.000Z",
      "resultCount": 6,
      "topVideos": ["videoId1", "videoId2", "videoId3"]
    }
  ],
  "feedback": [
    {
      "queryId": "q_a1b2c3d4",
      "videoId": "videoId1",
      "feedback": "thumbs_up",
      "compositeScore": 0.73,
      "rawSignals": { "commentDensity": 0.04, "subscriberCount": 1200000, "queryDescriptionOverlap": 0.67, "viewCount": 850000, "freshness": 0.82 },
      "feedbackAt": "2026-02-03T14:35:12.000Z"
    }
  ],
  "clickEvents": [
    {
      "queryId": "q_a1b2c3d4",
      "videoId": "videoId2",
      "clickedRank": 2,
      "clickedAt": "2026-02-03T14:33:05.000Z"
    }
  ],
  "quotaLog": [
    { "date": "2026-02-03", "unitsUsed": 204 }
  ]
}
```
- `queryId` is generated at search time using a random alphanumeric string (e.g. `q_` + 8 random chars). Links feedback and click events back to the query they came from.
- `topVideos` stores the top 3 video IDs from that search, in ranked order.
- `query` string lives only in `queryHistory` — `feedback` and `clickEvents` reference it via `queryId`, no duplication.
- `clickEvents` is append-only. One entry per video click. `clickedRank` is the position in the ranked list at the time of the click. Derive clicks-per-query by counting entries per `queryId`.
- Feedback log is append-only. Most recent entry per queryId + videoId pair is authoritative.
- `quotaLog` has one entry per calendar day, incremented after each search.

---

## API Route Contracts
- **POST `/api/search`** — Body: `{ query: string }` → Response: `{ results: RankedVideo[], quotaUnitsUsed: number }`
- **POST `/api/feedback`** — Body: `{ queryId, videoId, feedback, compositeScore, rawSignals }` → Response: `200 OK`
- **POST `/api/click`** — Body: `{ queryId, videoId, clickedRank }` → Response: `200 OK`. Fired simultaneously with opening the YouTube URL in a new tab — no waiting for the response before redirect.
- **GET `/api/quota`** — Response: `{ unitsUsedToday, dailyLimit: 10000, percentUsed }`

## Video Redirect Flow
When user clicks a video card thumbnail:
1. `POST /api/click` fires (logs the click event to `clickEvents` in JSON)
2. `window.open("https://www.youtube.com/watch?v={videoId}", "_blank")` fires simultaneously
3. YouTube opens in a new tab. Current page stays open — POST completes, user can keep browsing results.

---

## Feedback UX

### When Feedback Appears
Thumbs up/down buttons are always visible on each video card. No gating based on whether the user clicked the video — the user may have watched it before, or may be judging based on the thumbnail/title/channel (which is itself useful signal).

### Interaction Flow
1. User clicks thumbs up or thumbs down on a video card
2. `POST /api/feedback` fires with `queryId`, `videoId`, `feedback`, `compositeScore`, and `rawSignals`
3. The clicked button fills in (solid icon) to indicate selection. The other button remains outlined.
4. A brief toast appears at bottom of screen: "Feedback saved" (auto-dismisses after 2 seconds)

### Reversibility
- User can change their feedback by clicking the other button
- Clicking the already-selected button removes the feedback (both buttons return to outlined state)
- Each change fires a new `POST /api/feedback` — the most recent entry per `queryId + videoId` pair is authoritative
- A feedback value of `"none"` is logged when the user removes feedback entirely

### Visual States
| State | Thumbs Up | Thumbs Down |
|-------|-----------|-------------|
| No feedback | Outlined | Outlined |
| Thumbs up selected | Solid/filled | Outlined |
| Thumbs down selected | Outlined | Solid/filled |

---

## Build Order
| Step | What                                                                  | Why                                                                                       |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | `types/index.ts`                                                      | All contracts defined first                                                               |
| 2    | `services/youtube.ts`                                                 | Test API calls manually to confirm key works and response shapes match                    |
| 3    | `services/ranking.ts`                                                 | Unit test against hardcoded data before touching real API                                 |
| 4    | `services/storage.ts`                                                 | Simple read/write, test by inspecting JSON                                                |
| 5    | `api/search/route.ts`                                                 | Wire everything together. Test via curl against localhost                                 |
| 6    | `api/feedback/route.ts` + `api/click/route.ts` + `api/quota/route.ts` | Simple endpoints, test by POSTing/GETting and inspecting JSON                             |
| 7    | `QueryZone.tsx`                                                       | First UI piece. Wire to `/api/search`, log response to console                            |
| 8    | `VideoCard.tsx`                                                       | Single card layout from hardcoded data                                                    |
| 9    | `ResultsGrid.tsx`                                                     | Compose cards into grid                                                                   |
| 10   | `StatusFooter.tsx`                                                    | Wire to `/api/quota`                                                                      |
| 11   | `page.tsx`                                                            | Compose all zones, wire state                                                             |
| 12   | `LoadingState.tsx`                                                    | Skeleton cards. Render in place of ResultsGrid while search is in flight                  |
| 13   | `ErrorState.tsx`                                                      | Two variants: API failure with Try Again button, zero results with nudge to broaden query |


---

## Edge Cases
| Case | How |
|---|---|
| Video has 0 views | Guard: `Math.max(viewCount, 1)` to avoid division by zero |
| Channel hides subscriber count | Treat as 0. Log normalization handles it (`log10(1) = 0`) |
| Fewer than 10 results returned | Show what came back, no empty placeholders |
| Zero results returned | Show ErrorState variant: "No videos found. Try broader keywords." Quota still increments. |
| Empty query | Disable Find Videos button when input is empty |
| API key missing/invalid | Return 500 from route → ErrorState shows "Something went wrong" + Try Again |
| YouTube API error (rate limit, etc.) | Catch in `youtube.ts`, re-throw with status code → ErrorState shows "Something went wrong" + Try Again |
| Duration parsing | YouTube returns ISO 8601 format (e.g., `PT38M12S`). Parse to seconds, filter if < 120 seconds |
| Missing publishedAt | Treat as very old (score 0 for freshness). Extremely rare edge case. |

---

## What This Does NOT Include (Iteration 2+)
- **Semantic similarity for Query-Description matching** — replace keyword overlap with local embedding model (`@xenova/transformers`). No API needed. Gives meaning-based matching instead of exact word matching.
- Comment sentiment analysis (Claude API)
- ML-based weight adjustment from feedback data
- Voice-to-text / Obsidian transcription
- Video duration filtering UI
- Separate backend server
- Authentication or deployment