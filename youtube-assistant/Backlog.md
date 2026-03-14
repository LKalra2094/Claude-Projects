# Backlog

**Created**: February 2026
**Status**: In Progress

---

Prioritized list of planned work. Completed items move to `Changelog.md`.

| #   | Item                                | Category       | Dependencies                         | Notes                                                                                       |
| --- | ----------------------------------- | -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | Comment sentiment analysis          | Ranking        | YouTube comments.list API, LLM       | New ranking signal from comment tone.                                                       |
| 2   | Voice-to-text → Obsidian            | Feature        | Whisper model, Obsidian vault access | Transcribe videos with positive feedback + click. Builds personal knowledge base.           |
| 5   | Reduce latency                      | Performance    | TBD                                  |                                                                                             |
| 10  | Description length truncation       | Ranking        | —                                    | YouTube descriptions up to 5,000 chars. Cap to model's max token length before encoding.    |
| 11  | Query length validation             | Ranking        | —                                    | Very short queries produce weak embeddings. Define minimum length or hint to user.          |
| 12  | All-time period performance         | Performance    | —                                    | "All" period returns unbounded data points. Aggregate to weekly/monthly for large datasets. |
| 15  | Analytics tab state persistence     | UX             | —                                    | Time period resets when switching tabs. Persist selection.                                  |
| 16  | Embedding failure error UX          | Error Handling | —                                    | Show user-friendly message when Cohere API fails mid-search.                                |
| 17  | Clicks per non-null searches metric | Analytics      | —                                    | Only count non-null searches in denominator for avg clicks metric.                          |
| 19  | 5 videos per row layout             | UX             | —                                    | Current layout shows 2 per row. Change to 5 for denser display.                             |
| 20  | Define total results display limit  | UX             | —                                    | Define cutoff (top 20/30) or implement pagination/infinite scroll.                          |
| 21  | Authentication and user profiles    | Feature        | Auth provider (e.g. NextAuth)        | Two roles: regular and admin. Admin can access Admin tab, view weights, trigger model retrain. Regular users can only search and give feedback. |
| 22  | Per-user daily API quota            | Feature        | #21 (auth)                           | Divide daily quota equally among active users. Track per-user consumption.                  |
| 23  | Dark mode                          | UX             | —                                    | Add dark mode toggle or respect system preference. Apply across all tabs and components.    |
