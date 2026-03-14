# YouTube Assistant — Iteration 7: Authentication & Per-User Data

**Created**: March 2026
**Status**: Closed

---

## Scope Summary

Add Google sign-in via Auth.js v5 (NextAuth) and partition all user-generated data by user_id. Each user gets their own feedback, analytics, search history, and ML-trained ranking weights. Admin role (determined by environment variable) can view and manage any user's data from the Admin tab.

---

## Problem

The app is anonymous. All feedback, search history, click events, analytics, and ML weights are shared globally. To distribute to friends, each user needs their own isolated data and personalized ranking model. An admin role is needed so the owner can manage all users' weights.

---

## Approach

Auth.js v5 with Google OAuth provider. One-click sign-in, JWT session (no DB session table), no passwords. Admin role determined by `ADMIN_EMAIL` environment variable.

**Why Auth.js v5?**
- Built for Next.js App Router — single `auth()` function works in server components, route handlers, and middleware
- Google provider means zero signup friction (everyone has a Google account)
- Free, no vendor dependency
- JWT strategy keeps it simple — no session table needed

---

## Changes

### Phase 1 — Auth Foundation

| File | Change |
|------|--------|
| `package.json` | Install `next-auth@beta` (Auth.js v5) |
| `src/auth.ts` | **New.** Auth.js v5 config: Google provider, JWT session strategy. Single `auth()` export used everywhere |
| `src/app/api/auth/[...nextauth]/route.ts` | **New.** Route handler — exports GET/POST from auth.ts |
| `src/app/providers.tsx` | **New.** SessionProvider wrapper for client components |
| `src/app/layout.tsx` | Wrap app in SessionProvider |
| `src/middleware.ts` | **New.** Protect all routes — redirect unauthenticated users to sign-in |
| `src/app/signin/page.tsx` | **New.** Sign-in page with "Sign in with Google" button |
| DB migration (`scripts/migrate-v3.js`) | Create `users` table (id, email, name, image, role, created_at) |

**JWT strategy**: User info stored in the token. A minimal `users` table tracks known users and their roles. On first sign-in, upsert user row via NextAuth `signIn` callback.

### Phase 2 — Data Partitioning (DB Migration)

| Table | Change |
|-------|--------|
| `query_history` | Add `user_id TEXT` column |
| `feedback` | Add `user_id TEXT` column |
| `click_events` | Add `user_id TEXT` column |
| `ranking_weights` | Add `user_id TEXT` column |

All existing rows get a default user_id (the admin's email) so historical data isn't lost.

### Phase 3 — Service Layer Updates

| File | Change |
|------|--------|
| `src/services/storage.ts` | All writes include `user_id`. All reads filter by `user_id`. Functions: `addQueryHistory(userId, ...)`, `addFeedback(userId, ...)`, `addClickEvent(userId, ...)`, `getLatestFeedback(userId, ...)` |
| `src/services/weightStorage.ts` | `getActiveWeights(userId)`, `saveWeights(userId, ...)`, `getWeightHistory(userId)`, `revertToDefaults(userId)` |
| `src/services/weightLearning.ts` | `fetchTrainingData(userId)` — filter feedback by user_id |
| `src/services/ranking.ts` | `rankVideos(...)` takes userId, loads that user's weights |

### Phase 4 — API Route Updates

| File | Change |
|------|--------|
| `src/app/api/search/route.ts` | Extract userId from session, pass to storage and ranking |
| `src/app/api/feedback/route.ts` | Extract userId from session, pass to addFeedback |
| `src/app/api/click/route.ts` | Extract userId from session, pass to addClickEvent |
| `src/app/api/analytics/route.ts` | Extract userId from session (or from query param if admin), filter all queries by user_id |
| `src/app/api/weights/route.ts` | Extract userId (or from query param if admin), return per-user weights |
| `src/app/api/weights/train/route.ts` | Admin only. Accept target userId param. Train that user's model |
| `src/lib/auth.ts` | **New.** `getSessionUser(req)` helper, `isAdmin(session)` check |

### Phase 5 — UI Updates

Refer to `Product Requirments/Wireframes/Iteration 7 - Wireframes.md` for visual layouts of all new UI states.

| File | Change |
|------|--------|
| `src/app/page.tsx` | Show user avatar + name + sign-out button in header. Hide Admin tab for non-admin users |
| `src/components/AdminTab.tsx` | Add user picker dropdown at top. Admin selects a user to view their weights, training stats, and trigger training. Show list of all registered users |
| `src/components/AnalyticsTab.tsx` | No change needed — API already filters by session user |

---

## Environment Variables (new)

- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `NEXTAUTH_SECRET` — random secret for JWT signing
- `NEXTAUTH_URL` — app URL (Vercel sets this automatically)
- `ADMIN_EMAIL` — the admin user's Google email

---

## Verification

1. Deploy to Vercel preview via PR
2. Open app — should redirect to sign-in page
3. Sign in with Google — should see search UI with avatar in header
4. Search and give feedback — confirm user_id in DB rows
5. Sign in as admin — should see Admin tab
6. Admin tab shows user picker with registered users
7. Sign in as non-admin (different Google account) — no Admin tab visible
8. Analytics shows only that user's data
9. Train weights for a specific user from Admin tab
