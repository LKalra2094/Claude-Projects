# Claude Projects — Root Standards

**Created**: February 2026
**Status**: In Progress

---

## Commit Message Convention

**Subject line (first line):** Max 12 tokens.
Concise summary of the change. No period at the end.

**Body (optional):** Blank line after subject, then details.
Each line max 18 tokens. Use bullet points.

**No Co-Authored-By line.** Do not append attribution footers to commits.

### Example
```
Add auth and session management

- Integrate JWT-based authentication flow
- Add session tokens stored in httpOnly cookies
- Protect dashboard routes behind auth middleware
```

---

## Document Format

Every new document should start with this header:

```
# Document Title

**Created**: Month Year
**Status**: [In Progress | Closed]

---
```

- **Created:** The month and year the document was first written.
- **Status:** `In Progress` if the doc is still evolving.
  `Closed` once it's finalized and won't change.

---

## Project Structure

Each project lives in its own folder under `Claude Projects/`.
All project-specific files, docs, code, and git history
live inside that folder. When starting a new project,
create the following structure:

```
project-name/
├── Claude.md                          # Project context, reading order, iterations list
├── Session Status.md                  # What happened last, what to do next
├── Backlog.md                         # Prioritized planned work
├── Changelog.md                       # All shipped work, grouped by iteration
├── Iteration N - Implementation Plan.md   # One per iteration (1, 2, 3…)
├── Product Requirements/
│   ├── Project Name - Product Brief.md        # The WHY: problem, audience, goals
│   ├── Project Name - Product Requirements Document.md  # The WHAT: user stories, requirements
│   └── Wireframes/
│       ├── Iteration N - Wireframes.md        # Visual layout per iteration
│       └── Wireframe Tracker.md               # Status of all wireframes
└── Application/                       # All source code lives here
    └── ...
```

### Project Claude.md

Every project's `Claude.md` must include:

1. **Role context** — What this project is, who the user is in relation to it.
2. **Project location rule** — All files stay inside the project folder.
3. **Context reading order** — Numbered list of files to read when starting a session (Session Status first, then Claude.md, then Product Brief, PRD, Wireframes).
4. **Session handoff protocol** — Before ending a session, update `Session Status.md` with what was done, what changed, next steps, and key decisions.
5. **Iterations list** — Running list of all iteration plans with status (In Progress / Closed).
6. **Reference section** — Pointers to Backlog, Changelog, and Wireframe Tracker.

### Session Status.md

Acts as the handoff between sessions. Always read first.
Updated at the end of every session with:
- What was done
- What files were created or changed
- What the next steps are
- Key decisions made

### Backlog.md

Prioritized list of upcoming work. Items move to
Changelog.md when shipped as part of an iteration.

### Changelog.md

Record of all shipped work, grouped by iteration.
Updated during the Ship + Clean Up phase.

---

## Development Workflow

Every feature or fix follows this process. There are two gates where Claude must stop and wait for user approval. Everything else runs autonomously.

### 1. Plan
1. Create `Iteration N - Implementation Plan.md` (Status: In Progress) with scope, problem, changes, and files affected.

**GATE 1 — Stop and wait for user approval before coding.**

### 2. Build
2. Create a worktree: `git worktree add -b <branch-name> .worktrees/<name> main`
3. Implement all code changes inside the worktree directory.
4. Commit and push the worktree branch: `git push -u origin <branch-name>`

### 3. Test
5. Create a PR: `gh pr create --title "..." --body "..."`
6. User opens the Vercel preview URL (found in PR checks or Vercel dashboard) and verifies changes.

**GATE 2 — Stop and wait for user to confirm the PR looks good.**

### 4. Ship + Clean Up (autonomous after Gate 2)
7. Merge the PR: `gh pr merge --squash --delete-branch`
8. Pull main: `git pull origin main`
9. Remove the worktree: `git worktree remove .worktrees/<name>` (use `--force` if needed)
10. Delete the remote branch if not auto-deleted: `git push origin --delete <branch-name>`
11. Mark the iteration plan as Status: Closed. Update Iterations list in project Claude.md and `Changelog.md`.
12. Commit and push doc updates directly to main.
