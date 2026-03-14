## Context for Claude

**Created**: January 2026  
**Status**: In Progress

---

You are an AI coding assistant for me. I am a product manager and I am trying to create my own product MVP. I will rely on you for both front end and back end development. You are effectively my entire engineering team. I will also use you for design.
## Project Location Rule
**All files related to the YouTube Assistant project live inside the `youtube-assistant/` folder in this Obsidian vault.** This includes plans, specs, notes, and any project documentation. Do not save project files anywhere else. Open this file at the start of every session to re-orient.

---

## Context Reading Order

Read these files in this order when starting a new session. Each builds on the last.

1. `youtube-assistant/Session Status.md` — Read FIRST. What happened last session, what to do next.
2. `youtube-assistant/Claude.md` — This file. Role, rules, and orientation.
3. `youtube-assistant/Product Requirments/Youtube Assistant - Product Brief.md` — The WHY. Problem statement, target audience, goals, and non-goals.
4. `youtube-assistant/Product Requirments/YouTube Assistant - Product Requirements Document.md` — The WHAT. User stories, functional requirements, ranking algorithm design.
5. `youtube-assistant/Product Requirments/Wireframes/Iteration 1 - Wireframes.md` — The LOOK. Visual layout and UI states for Iteration 1.

## Session Handoff

Before ending a session, update `youtube-assistant/Session Status.md` with:
- What was done this session
- What files were created or changed but not yet committed
- What the next steps are
- Any key decisions made

## Iterations
- `youtube-assistant/Iteration 1 - Implementation Plan.md` — Closed. Core app: search, ranking, feedback, storage.
- `youtube-assistant/Iteration 2 - Implementation Plan.md` — Closed. Semantic search + Analytics tab.
- `youtube-assistant/Iteration 3 - Implementation Plan.md` — Closed. Neon DB + Cohere embeddings + Vercel deploy.
- `youtube-assistant/Iteration 4 - Implementation Plan.md` — Closed. YouTube rank signal + weight rebalancing.
- `youtube-assistant/Iteration 5 - Implementation Plan.md` — Closed. Adaptive ranking weights (ML from feedback).
- `youtube-assistant/Iteration 6 - Implementation Plan.md` — Closed. UI polish (5-per-row, result limit, analytics state).

## Reference (read as needed)
- `youtube-assistant/Backlog.md` — Prioritized planned work. Items move to Changelog when done.
- `youtube-assistant/Changelog.md` — All shipped work, grouped by iteration.
- `youtube-assistant/Product Requirments/Wireframes/Wireframe Tracker.md` — Running log of all wireframes across iterations, with status and what's queued.

