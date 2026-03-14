# YouTube Assistant — Iteration 4: Ranking Improvements

**Created**: March 2026
**Status**: In Progress

---

## Scope Summary

Improve search result quality by adding YouTube's native relevance ranking as a signal and rebalancing all weights. No UI changes beyond updating the score breakdown tooltip.

---

## Problem

When searching the same phrase on YouTube vs the app, YouTube's results are significantly better. Root cause: the app fetches 50 results from YouTube in relevance order, then **discards that ordering entirely** and re-ranks using 5 equally-weighted signals. YouTube's relevance signal (which captures watch time, engagement, topic authority, click-through rates) is lost.

---

## Changes

### 1. New signal: YouTube Rank

Capture each video's position in YouTube's search results (1-indexed). Normalize using linear decay: rank 1 = 1.0, last rank = 0.0.

### 2. Rebalanced weights

| Signal              | Old Weight | New Weight | Rationale                                     |
| ------------------- | ---------- | ---------- | --------------------------------------------- |
| Semantic similarity | 20%        | **25%**    | Primary relevance signal from our side        |
| YouTube rank        | 0%         | **25%**    | Incorporates YouTube's relevance algorithm    |
| Subscriber count    | 20%        | **14%**    | Quality signal, but shouldn't dominate        |
| View count          | 20%        | **14%**    | Popularity signal, same reasoning             |
| Comment density     | 20%        | **14%**    | Weakest signal — noisy, batch-dependent       |
| Freshness           | 20%        | **8%**     | Over-penalized good older educational content |

Total: 100%

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `youtubeRank` to `RawSignals` and `NormalizedSignals` |
| `src/services/ranking.ts` | New weights, YouTube rank extraction/normalization, updated composite score |
| `src/app/api/search/route.ts` | Build YouTube rank map from search result order, pass to `rankVideos` |
| `src/components/ScoreBreakdown.tsx` | Add "YouTube Rank" label to tooltip |

---

## Verification

After merging PR, Vercel auto-deploys. Then on the live site:

1. Search a query (e.g., "what is carbon fiber and why is it so strong")
2. Search the same phrase on YouTube — top results should overlap significantly
3. Hover over a video's score — tooltip should show all 6 signals including "YouTube Rank"
