# YouTube Assistant — Iteration 5: Adaptive Ranking Weights

**Created**: March 2026
**Status**: Closed

---

## Scope Summary

Add ML-based weight learning so ranking improves over time from thumbs up/down feedback. New Admin tab for managing weights. No changes to the ranking signals themselves — only how they're weighted.

---

## Problem

Ranking weights are hardcoded ({semantic: 25%, youtubeRank: 25%, subs: 14%, views: 14%, comments: 14%, freshness: 8%}). The app collects thumbs up/down feedback but never uses it. When a user thumbs-up a video, the signals that ranked it highly should be reinforced; when they thumbs-down, those signals should be dampened.

---

## Approach

**Logistic regression in TypeScript** — no external ML libraries.

- Sigmoid maps the composite score to a probability of "thumbs up"
- Binary cross-entropy loss is minimized via gradient descent
- Simplex projection after each gradient step enforces: weights sum to 1, each in [0.03, 0.50]
- Convex problem → guaranteed convergence

### Why not something fancier?
- Only 6 parameters to learn — neural nets and random forests are overkill
- Pairwise ranking needs pairs from the same query with opposite feedback — too rare with low data volume
- Logistic regression uses every labeled example independently

---

## Data Fix: Store Normalized Signals

Currently feedback stores only raw signals. But weights multiply *normalized* signals. Comment density normalization is batch-dependent (min-max across search results), so raw signals can't be re-normalized later.

**Fix**: Add `normalized_signals JSONB` to the feedback table. Send normalized signals from frontend alongside raw signals. Training data starts accumulating from deployment forward — old feedback rows without normalized signals are excluded from training.

---

## Safeguards

1. **Minimum threshold**: 30 labeled examples, at least 5 thumbs-up AND 5 thumbs-down
2. **Weight bounds**: Floor 0.03 (3%), cap 0.50 (50%) per signal
3. **Validation holdout**: 80/20 split. Only activate weights if validation accuracy > 65%
4. **Manual trigger**: POST /api/weights/train — no auto-updating
5. **Dry-run mode**: Preview proposed weights before committing
6. **Revert**: Can revert to defaults or any previous weight set instantly

---

## Changes

### Phase 1 — Data Foundation

| File | Change |
|------|--------|
| DB migration | `ALTER TABLE feedback ADD COLUMN normalized_signals JSONB` |
| DB migration | Create `ranking_weights` table (id, weights JSONB, training_count, validation_acc, is_active, created_at) |
| `src/types/index.ts` | Add `normalizedSignals?: NormalizedSignals` to `FeedbackEntry`, add `normalizedSignals` to `FeedbackRequest`, add `WeightSet` type |
| `src/app/page.tsx` | Send `normalizedSignals` in feedback API call (already available on RankedVideo) |
| `src/app/api/feedback/route.ts` | Extract and pass `normalizedSignals` |
| `src/services/storage.ts` | Store `normalized_signals` in feedback INSERT |

### Phase 2 — Weight Learning Engine

| File | Change |
|------|--------|
| `src/services/weightLearning.ts` | **New.** `trainWeights()`, `sigmoid()`, `simplexProjection()`, `validateWeights()`, `fetchTrainingData()` |
| `src/services/weightStorage.ts` | **New.** `getActiveWeights()`, `saveWeights()`, `getWeightHistory()`, `revertToDefaults()` |

### Phase 3 — API Endpoints + Ranking Integration

| File | Change |
|------|--------|
| `src/app/api/weights/route.ts` | **New.** GET current weights (learned or default) |
| `src/app/api/weights/train/route.ts` | **New.** POST to trigger training (accepts `dryRun` flag) |
| `src/services/ranking.ts` | Load weights from DB via `getActiveWeights()`, fall back to `DEFAULT_WEIGHTS` |

### Phase 4 — Admin Tab

| File | Change |
|------|--------|
| `src/components/AdminTab.tsx` | **New.** Current weights display (bar chart), default vs learned comparison, training stats (sample count, validation accuracy, last trained date), "Train Weights" button with dry-run preview, weight history table, "Revert to Defaults" button |
| `src/app/page.tsx` | Add "Admin" as third tab alongside Search and Analytics |

---

## Verification

1. Deploy to Vercel preview via PR
2. Search and give thumbs up/down — confirm `normalized_signals` appears in feedback table
3. POST /api/weights/train — should return "insufficient data" (below 30 threshold)
4. Check Admin tab shows default weights and training status
5. After accumulating 30+ feedback points over time, trigger training and inspect proposed weights via dry-run
6. Activate learned weights and compare search quality
