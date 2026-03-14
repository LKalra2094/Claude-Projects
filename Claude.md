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
live inside that folder. Each project has its own `Claude.md`
with context and reading order for that project.

---

## Development Workflow

Every feature or fix follows this process. Claude should proactively prompt through each step.

### 1. Plan
1. Create `Iteration N - Implementation Plan.md` (Status: In Progress) with scope, problem, changes, and files affected.

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
11. Mark the iteration plan as Status: Closed. Update Iterations list in project Claude.md and `Changelog.md`.
12. Commit and push doc updates directly to main.
