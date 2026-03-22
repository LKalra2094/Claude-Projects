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
live inside that folder.

```
project-name/
├── Claude.md                          # Project context, reading order, sprints list
├── Session Status.md                  # What happened last, what to do next
├── Product Backlog.md                 # All planned + completed work, tracked by sprint
├── Product Requirements/
│   ├── Project Name - Product Brief.md        # The WHY: problem, audience, goals
│   └── Project Name - Product Requirements Document.md  # The WHAT: user stories, requirements
├── Sprint N/                          # One folder per sprint, all artifacts inside
│   ├── Technical Spec.md              # How to build it: scope, architecture, files affected
│   ├── Design Doc.md                  # How it looks: layouts, flows, interactions
│   └── ...                            # Data files, research, or other sprint artifacts
└── Application/                       # All source code lives here
    └── ...
```

### Project Claude.md Requirements

Every project's `Claude.md` must include:

1. **Role context** — What this project is, who the user is in relation to it.
2. **Project location rule** — All files stay inside the project folder.
3. **Context reading order** — Numbered list of files to read when starting a session (Session Status first, then Claude.md, then Product Brief, PRD, then current sprint's Technical Spec and Design Doc).
4. **Session handoff protocol** — Before ending a session, update `Session Status.md` with what was done, next steps, and key decisions.
5. **Sprints list** — Running list of all sprints with status (In Progress / Closed).
6. **Reference section** — Pointer to Product Backlog.

---

## Project Lifecycle

Follow these phases in order. Do not skip ahead. **Each project is its own git repo and its own GitHub repo.** The root directory (`Claude Projects/`) is a separate repo that holds only shared files (CLAUDE.md, templates). Project folders are listed in the root `.gitignore` so they are never tracked by the root repo.

### Phase 1: Foundation (docs, no code)

When the user describes a new project, **automatically** do the following without being asked:

1. Create the project folder (lowercase, hyphenated) in the root directory.
2. Initialize it as its own git repo: `git init` inside the project folder.
3. Create a `Product Requirements/` subfolder.
4. Write the **Product Brief** (`Product Requirements/Project Name - Product Brief.md`) using `Product_Brief_Template.md` as the template.
5. Create `Claude.md` with project context, reading order, and sprints list.
6. Create `Session Status.md` using `Session_Status_Template.md` as the template.
7. **Stop and wait for user approval** on the Product Brief before doing anything else.

After the user approves the Product Brief:

8. Create the GitHub repo and push: `gh repo create <github-username>/<project-name> --public --description "<one-line description>" --source . --push`
9. Write the **Product Requirements Document** (`Product Requirements/Project Name - Product Requirements Document.md`) using `Product_Requirements_Template.md` as the template.
10. Create **Product Backlog.md** with all work items derived from the PRD. Use `Product_Backlog_Template.md` as the template.
11. Update `Session Status.md` and `Claude.md` to reflect completed foundation work.

**All Phase 1 docs are committed directly to main.** No branches, no PRs.

### Phase 2: Sprint Cycle (repeats for each sprint)

Once the foundation is in place, work happens in sprints. Each sprint follows the Development Workflow below.

---

## Worktree Safety Rule

At the start of every session, check if you are inside a worktree (`git worktree list`). If the current task is documentation (plans, session status, product backlog, CLAUDE.md, or any non-code file), **exit the worktree and work directly on main.** Worktrees are only for source code during the Build phase.

---

## Development Workflow

Every sprint follows this process. There are two gates where Claude must stop and wait for user approval. Everything else runs autonomously.

### 1. Plan
1. Create the `Sprint N/` folder with:
   - `Technical Spec.md` (Status: In Progress) — scope, problem, changes, and files affected.
   - `Design Doc.md` — layouts, flows, and interactions. Skip if the sprint has no UI changes.
   - **Commit these directly to main** — sprint docs are not code.

**GATE 1 — Stop and wait for user approval before coding.**

### 2. Build
2. Create a worktree: `git worktree add -b <branch-name> .worktrees/<name> main`
3. Implement all code changes inside the worktree directory.
   - **Only source code goes in worktrees.** Documentation (plans, session status, product backlog) is always committed directly to main.
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
11. Mark the sprint's Technical Spec and other files as Status: Closed. Update Sprints list in project Claude.md. Update shipped items in `Product Backlog.md` (Status → Done, Shipped In → Sprint N).
12. Commit and push doc updates directly to main.
