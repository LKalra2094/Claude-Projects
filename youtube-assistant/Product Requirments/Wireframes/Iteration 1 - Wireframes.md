# YouTube Assistant — Wireframes: Iteration 1 

**Created:** February 2026
**Status**: Closed

---

> **Note on "likes":** The Product Spec lists likes as a card field. The Iteration 1 Implementation Plan dropped `likeCount` as unreliable — YouTube removed public like counts in Nov 2021. These wireframes omit likes. Revisit if the field proves consistently available via the API.

---

## Legend

| Symbol | Meaning |
|---|---|
| `[ THUMBNAIL ]` | Video thumbnail image placeholder |
| `Find Videos` | Search button, inline right of input (Google-style bar) |
| `(disabled)` | Button is greyed out / not clickable |
| `[ + ]  [ - ]` | Thumbs up / down feedback (bottom-right of each card) |
| `████░░░░` | Quota bar — filled = used, light = remaining |
| `···` | Pattern continues in same structure |

---

## 1. Empty State

Initial page load. No search has been run. The Find Videos button is disabled because the input is empty.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            YouTube Assistant                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  What do you want to learn? e.g. "how transformers..."  │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                          (disabled when empty) │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Quota:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0 / 10,000 (0%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Results State

After a successful search. Row 1 is drawn in full detail to show all card fields. Rows 2–5 follow the exact same card structure.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            YouTube Assistant                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  how transformers work in AI                             │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                                              │
├── Results ───────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────┐   ┌────────────────────────────────┐   │
│   │  ┌──────────────────────┐     │   │  ┌──────────────────────┐     │   │
│   │  │                      │     │   │  │                      │     │   │
│   │  │   [ THUMBNAIL ]      │     │   │  │   [ THUMBNAIL ]      │     │   │
│   │  │                      │     │   │  │                      │     │   │
│   │  └──────────────────────┘     │   │  └──────────────────────┘     │   │
│   │  #1  How Transformers Work    │   │  #2  Attention Is All You..   │   │
│   │  ──────────────────────────   │   │  ──────────────────────────   │   │
│   │  Channel   3Blue1Brown        │   │  Channel   StatQuest          │   │
│   │  Duration  38:12              │   │  Duration  22:45              │   │
│   │  Views     2.4M               │   │  Views     890K               │   │
│   │  Comments  18K                │   │  Comments  6.2K               │   │
│   │  Score     0.82               │   │  Score     0.77               │   │
│   │                               │   │                               │   │
│   │                 [ + ]  [ - ]  │   │                 [ + ]  [ - ]  │   │
│   └───────────────────────────────┘   └───────────────────────────────┘   │
│                                                                              │
│   ┌───────────────────────────────┐   ┌───────────────────────────────┐   │
│   │  #3  ...                      │   │  #4  ...                      │   │
│   │  (same card structure)        │   │  (same card structure)        │   │
│   └───────────────────────────────┘   └───────────────────────────────┘   │
│                                                                              │
│                      ···  rows 3–5 same layout  ···                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  102 / 10,000 (1%) │
└──────────────────────────────────────────────────────────────────────────────┘
```
## 3. Loading State

User has typed a query and clicked Find Videos. API calls are in flight. Skeleton cards show in place of results so the user understands the layout before data arrives. Find Videos button is disabled to prevent duplicate requests.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            YouTube Assistant                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  how transformers work in AI                             │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                          (disabled)           │
│                                                                              │
├── Searching… ────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────┐   ┌────────────────────────────────┐   │
│   │  ┌──────────────────────┐     │   │  ┌──────────────────────┐     │   │
│   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │
│   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │
│   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │  │  ░░░░░░░░░░░░░░░░░░░░│     │   │
│   │  └──────────────────────┘     │   │  └──────────────────────┘     │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░    │   │  ░░░░░░░░░░░░░░░░░░░░░░░░░    │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░    │   │  ░░░░░░░░░░░░░░░░░░░░░░░░░    │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│   └────────────────────────────────┘   └────────────────────────────────┘   │
│                                                                              │
│   ┌────────────────────────────────┐   ┌────────────────────────────────┐   │
│   │  (same skeleton structure)     │   │  (same skeleton structure)     │   │
│   └────────────────────────────────┘   └────────────────────────────────┘   │
│                                                                              │
│                      ···  rows 3–5 same layout  ···                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  102 / 10,000 (1%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

> `░░░` = skeleton placeholder. Animates with a subtle pulse in implementation. Each line represents a piece of content that will be replaced when data arrives (thumbnail, title, channel, stats).

---

## 4. Error State — API Failure

Something went wrong on the backend (YouTube API error, rate limit hit, network failure). Error banner appears in the results area. User can retry without retyping the query.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            YouTube Assistant                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  how transformers work in AI                             │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐    │
│   │  ⚠  Something went wrong. Please try again.                        │    │
│   │                                                      [ Try Again ]  │    │
│   └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  102 / 10,000 (1%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

> `Try Again` re-fires the same query. No retyping needed. Quota still shows — if the failure was a rate limit, this tells the user why.

---

## 5. Error State — Zero Results

The search ran successfully but YouTube returned no matching videos for this query. No error — just an empty result set with a nudge to try different keywords.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            YouTube Assistant                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  xkcd quantum entanglement tutorial for dogs            │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐    │
│   │  No videos found for this query.                                    │    │
│   │  Try using different or broader keywords.                           │    │
│   └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  204 / 10,000 (2%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

> Quota incremented to 204 — the search call still fired and consumed units even though no results came back. This is accurate: YouTube charges for the `search.list` call regardless of result count.