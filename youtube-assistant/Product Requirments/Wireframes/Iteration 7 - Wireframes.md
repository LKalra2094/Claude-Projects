# YouTube Assistant — Wireframes: Iteration 7

**Created**: March 2026
**Status**: In Progress

---

## Legend

| Symbol | Meaning |
|---|---|
| `☰` | Hamburger menu icon (top left). Opens navigation dropdown. |
| `✕` | Close icon. Replaces ☰ when menu is open. |
| `[ 🔵 ]` | Google sign-in button |
| `( avatar )` | User's Google profile picture, circular |
| `[ ▼ ]` | Dropdown selector |

---

## 1. Sign-In Page

First thing any user sees. No access to the app without signing in. Clean, centered layout with a single Google button.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                         YouTube Assistant                                    │
│                                                                              │
│                    Sign in to get started                                    │
│                                                                              │
│                ┌──────────────────────────────┐                              │
│                │  🔵  Sign in with Google      │                              │
│                └──────────────────────────────┘                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> After clicking, the standard Google account picker appears (browser popup or redirect). On success, user is redirected to the Search tab.

---

## 2. Header — Signed In (Regular User)

After sign-in, the header shows the user's avatar and name on the right side. The hamburger menu does NOT include Admin.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ☰                     YouTube Assistant              ( avatar )  Jane D.   │
│                                                                  Sign out   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┬─────────────┐  │
│   │  What do you want to learn?                              │ Find Videos │  │
│   └──────────────────────────────────────────────────────────┴─────────────┘  │
│                                                                              │
│                      ···  search results  ···                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Daily API Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  510 / 10,000 (5%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Header — Signed In (Admin User)

Same as regular user, but the hamburger menu includes the Admin option.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✕                     YouTube Assistant              ( avatar )  Lakshay K. │
│  ┌─────────────┐                                                 Sign out   │
│  │  ▸ Search   │  ← current page (highlighted)                             │
│  │    Analytics │                                                            │
│  │    Admin     │  ← only visible for admin                                 │
│  └─────────────┘                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      ···  search results  ···                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> The Admin menu item only appears when the signed-in user's email matches the `ADMIN_EMAIL` env var.

---

## 4. Hamburger Menu — Regular User (No Admin)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✕                     YouTube Assistant              ( avatar )  Jane D.   │
│  ┌─────────────┐                                                 Sign out   │
│  │  ▸ Search   │  ← current page (highlighted)                             │
│  │    Analytics │                                                            │
│  └─────────────┘                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      ···  search results  ···                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> Only two menu items: Search and Analytics. No Admin option.

---

## 5. Admin Tab — User Picker

Admin sees a user picker dropdown at the top of the Admin tab. Selecting a user loads that user's weights, training stats, and feedback data. All existing Admin tab functionality (weight bars, train button, history) works per-user.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ☰                           Admin                    ( avatar )  Lakshay K. │
│                                                                  Sign out   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Viewing data for:  [ Jane D. (jane@gmail.com) ▼ ]                         │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Current Weights (Jane D.)                                          │    │
│   │                                                                     │    │
│   │  Semantic Sim    ████████████████████████████████  0.32  (def: 0.25) │    │
│   │  YouTube Rank    ██████████████████████████        0.22  (def: 0.25) │    │
│   │  Comment Dens    ████████████████                  0.15  (def: 0.14) │    │
│   │  Subscriber Ct   ██████████████                    0.12  (def: 0.14) │    │
│   │  View Count      ████████████                      0.11  (def: 0.14) │    │
│   │  Freshness       ████████                          0.08  (def: 0.08) │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Training Data                                                      │    │
│   │  Total: 47   Thumbs up: 28   Thumbs down: 19                      │    │
│   │                                                                     │    │
│   │  [ Preview New Weights ]    [ Revert to Defaults ]                 │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Weight History                                                     │    │
│   │  ──────────────────────────────────────────────────────────────     │    │
│   │  #1  Mar 12, 2026   Samples: 47   Accuracy: 72%   ● Active        │    │
│   │  #0  (Defaults)                                                    │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Daily API Quota:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  510 / 10,000 (5%) │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Admin Tab — User Picker Dropdown Open

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ☰                           Admin                    ( avatar )  Lakshay K. │
│                                                                  Sign out   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Viewing data for:  [ Jane D. (jane@gmail.com) ▼ ]                         │
│                      ┌──────────────────────────────────┐                    │
│                      │  Lakshay K. (lakshay@gmail.com)  │                    │
│                      │  Jane D. (jane@gmail.com)    ✓   │                    │
│                      │  Alex M. (alex@gmail.com)        │                    │
│                      └──────────────────────────────────┘                    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Current Weights (Jane D.)                                          │    │
│   │  ···                                                                │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                      ···  rest of admin tab  ···                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> Dropdown lists all registered users. Checkmark shows currently selected. Selecting a different user refreshes all data on the page for that user.
