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

1. `youtube-assistant/Claude.md` — This file. Role, rules, and orientation.
2. `youtube-assistant/Product Requirments/Youtube Assistant - Product Brief.md` — The WHY. Problem statement, target audience, goals, and non-goals.
3. `youtube-assistant/Product Requirments/YouTube Assistant - Product Requirements Document.md` — The WHAT. User stories, functional requirements, ranking algorithm design.
4. `youtube-assistant/Product Requirments/Wireframes/Iteration 1 - Wireframes.md` — The LOOK. Visual layout and UI states for Iteration 1.

## Iterations
- `youtube-assistant/Iteration 1 - Implementation Plan.md` — Closed. Core app: search, ranking, feedback, storage.
- `youtube-assistant/Iteration 2 - Implementation Plan.md` — Closed. Semantic search + Analytics tab.
- `youtube-assistant/Iteration 3 - Implementation Plan.md` — Closed. Neon DB + Cohere embeddings + Vercel deploy.
- `youtube-assistant/Iteration 4 - Implementation Plan.md` — Closed. YouTube rank signal + weight rebalancing.

## Reference (read as needed)
- `youtube-assistant/Backlog.md` — Prioritized planned work. Items move to Changelog when done.
- `youtube-assistant/Changelog.md` — All shipped work, grouped by iteration.
- `youtube-assistant/Product Requirments/Wireframes/Wireframe Tracker.md` — Running log of all wireframes across iterations, with status and what's queued.

---

## Development Workflow

Every feature or fix follows this process. Claude should proactively prompt through each step.

### 1. Plan
1. Create `youtube-assistant/Iteration N - Implementation Plan.md` (Status: In Progress) with scope, problem, changes, and files affected.

### 2. Build
2. Create a worktree: `git worktree add -b <branch-name> .worktrees/<name> main`
3. Implement all code changes inside the worktree directory.
4. Commit and push the worktree branch: `git push -u origin <branch-name>`

### 3. Test
5. Create a PR: `gh pr create --title "..." --body "..."`
6. Open the Vercel preview URL (found in PR checks or Vercel dashboard) and verify changes.

### 4. Ship
7. Merge the PR: `gh pr merge --squash --delete-branch`
8. Pull main: `git pull origin main`

### 5. Clean Up
9. Remove the worktree: `git worktree remove .worktrees/<name>` (use `--force` if needed)
10. Delete the remote branch if not auto-deleted: `git push origin --delete <branch-name>`
11. Mark the iteration plan as Status: Closed. Update Iterations list in this file and `Changelog.md`.
12. Commit and push doc updates directly to main.
