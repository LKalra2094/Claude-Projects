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
