# YouTube Assistant — Iteration 8: Dark Mode, Sign-out Confirmation, Admin Analytics

**Created**: March 2026
**Status**: In Progress

---

## Scope Summary

Three independent features: (1) dark mode with system preference detection and manual toggle, (2) sign-out confirmation dialog, (3) admin per-user analytics dashboard showing searches, clicks, and feedback per user.

---

## Problem

1. Light-mode only UI — no respect for OS dark mode preference.
2. Sign-out button fires instantly — one accidental click logs users out.
3. Admin has no visibility into per-user activity (searches, clicks, feedback).

---

## Approach

- **Dark mode:** CSS variable overrides via `[data-theme="dark"]` selector + `prefers-color-scheme` media query fallback. Manual toggle cycles system → light → dark. localStorage persistence. Blocking inline script prevents flash of wrong theme.
- **Sign-out confirmation:** Generic `ConfirmDialog` component (no external library). Overlay + centered card. Wired to sign-out button.
- **Admin analytics:** New `/api/admin/user-stats` endpoint aggregates searches, clicks, and feedback per user via three parallel DB queries. Rendered as a table in AdminTab.

---

## Changes

### Phase 1 — Dark Mode

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `[data-theme="dark"]` block with dark overrides for all 14 CSS variables. Add `@media (prefers-color-scheme: dark)` fallback. Update `.skeleton` to use CSS variables instead of hardcoded colors |
| `src/app/layout.tsx` | Add blocking inline `<script>` in `<head>` that reads `localStorage('theme')` and sets `data-theme` before paint |
| `src/app/page.tsx` | Add `theme` state (light/dark/system), init from localStorage. Moon/sun toggle button in header. `matchMedia` listener for live system preference changes |
| `src/app/signin/page.tsx` | Replace hardcoded `backgroundColor: 'white'` and `color: '#333'` with CSS variable equivalents |

Dark palette: background `#0a0a0a`, foreground `#ededed`, card `#1a1a1a`, border `#2e2e2e`, muted `#a3a3a3`, secondary `#d4d4d4`, accent `#60a5fa`, primary `#ef4444`.

No other component changes needed — all components already use CSS variables.

### Phase 2 — Sign-out Confirmation

| File | Change |
|------|--------|
| `src/components/ConfirmDialog.tsx` | **New.** Generic confirmation dialog: overlay + centered card with title, message, Cancel/Confirm buttons. Uses CSS variables for dark mode compatibility. Backdrop click closes |
| `src/app/page.tsx` | Add `showSignOutConfirm` state. Change sign-out button onClick to open dialog. Render `<ConfirmDialog>` with title="Sign out?" and danger-styled confirm |

### Phase 3 — Admin Per-User Analytics

| File | Change |
|------|--------|
| `src/app/api/admin/user-stats/route.ts` | **New.** Admin-only GET endpoint. Three parallel queries: searches per user (from `query_history`), clicks per user (from `click_events`), feedback per user (from `feedback`). Merge by email, return sorted by searches descending |
| `src/components/AdminTab.tsx` | Add "User Activity" section above weight management. Fetch `/api/admin/user-stats` on mount. Table with columns: User (avatar + name), Email, Searches, Clicks, Feedback. Reuse existing table styles |

Note: `quota_log` has no `user_id` column — API units column is omitted. Per-user quota tracking can be a future backlog item if needed.

---

## Files Summary

| File | Action | Feature |
|------|--------|---------|
| `src/app/globals.css` | Modify | Dark mode |
| `src/app/layout.tsx` | Modify | Dark mode |
| `src/app/page.tsx` | Modify | Dark mode + Sign-out confirmation |
| `src/app/signin/page.tsx` | Modify | Dark mode |
| `src/components/ConfirmDialog.tsx` | **New** | Sign-out confirmation |
| `src/app/api/admin/user-stats/route.ts` | **New** | Admin analytics |
| `src/components/AdminTab.tsx` | Modify | Admin analytics |

**No new dependencies.** No DB migrations.

---

## Verification

1. Deploy to Vercel preview via PR
2. **Dark mode:** Toggle light/dark/system across all tabs. Verify sign-in page. Refresh — no flash. Change OS preference in system mode
3. **Sign-out confirmation:** Click sign out → dialog appears. Cancel → stays signed in. Confirm → signs out. Backdrop click → closes
4. **Admin analytics:** Open Admin tab → user activity table shows all users with stats. Non-admin cannot access `/api/admin/user-stats`
