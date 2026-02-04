# Product Brief: YouTube Assistant

**Product Manager**: Lakshya Kalra  
**Date**: January 2026  
**Status**: Closed

---

## Opportunity

### Problem Statement

When searching for educational content on YouTube, high-intent learners waste significant time evaluating and discarding low-quality videos before finding content that matches their needs. The problem manifests in a predictable pattern: open a video, watch 2-5 minutes, realize the content is padded with filler, engagement bait, or lacks depth, then repeat the cycle.

### Supporting Evidence

**Personal Validation:** Opening 3-5 videos before finding one worth watching, leading to wastage of time and recurring frustration.

**YouTube Growth:** YouTube hosts 4.3–5.1 billion videos with ~2.6 million new uploads daily. This volume makes quality discovery increasingly difficult and users searching any topic face overwhelming content with no reliable way to assess quality before watching.

**Research Evidence:** A 2018 academic study (Zannettou et al.) found YouTube's recommendation engine "does not take into account clickbait" and is "susceptible to recommending misleading videos." A December 2025 Kapwing study found 21–33% of videos shown to new users are low-quality AI-generated content, with 278 identified "AI slop" channels accumulating 63 billion views.

**Incentive Misalignment:** YouTube optimizes for engagement, not information density. Creators are incentivized to pad videos (longer = more ad slots), use clickbait, and optimize for "moreishness" over substance. There is no signal for "information density" or "respects the viewer's time."

---

## Target Audience

Power learners who use YouTube for self-education. Specifically, users who:
- Value information density over entertainment
- Have domain expertise and can recognize shallow content
- Are frustrated by clickbait, unnecessary preambles, and artificially elongated videos
- Watch educational/informational content (tutorials, explainers, deep dives)

---

## Goal

### Qualitative

- The first video suggested for a query is watchable start-to-finish without regret
- Confidence that suggested videos respect the viewer's time

### Quantitative

- Videos sampled before finding a "keeper" should go down
- Time spent finding the right video should go down 
- Top-ranked videos should receive thumbs up from users

---

## Non-Goals

| What We're NOT Solving | Why |
|------------------------|-----|
| Entertainment content discovery | Different quality heuristics; subjective preferences dominate |
| Replacing YouTube search entirely | Still useful for browsing; this tool is for targeted research |
| Building a consumer product | Personal tool; no need for scale, auth, or multi-user support |
| Real-time recommendations | Batch analysis is fine; willing to wait a few seconds |
| Mobile-first experience | simple web UI is sufficient |

---

## User Experience

**Step 1:** User describes the information or knowledge they are looking for  
**Step 2:** Agent selects most relevant N videos and uses YouTube API to pull relevant data  
**Step 3:** Agent ranks videos based on user need  
**Step 4:** Agent returns top N results  
**Step 5:** User selects video they want to watch and are redirected to the youtube page for that video
**Step 6:** Agent collects feedback on results

---

## Open Questions

| Question | Next Steps |
|----------|------------|
| How do we rank videos? | Find data available via the Youtube API |
| What will it cost? | Research on Claude and Youtube API costs and limits |
| How long will the user have to wait? | How do we reduce latency? |