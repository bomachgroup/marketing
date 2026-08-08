# Plan 01-01 — Summary

**Status:** DONE — verified via `tsc --noEmit`, `vite build`, and agent-browser at http://localhost:5173.

## Changes
- **`src/navigation.ts`** (new): `SCREEN_TITLES` (all 37 nav screens + `leads-detail`, verbatim from HTML), `screenPath(s)`, `roleFirstScreen(roleKey)`, `screenTitleFromPath(pathname)`.
- **`src/components/layout/Sidebar.tsx`**: imports `useNavigate`/`useLocation` + `roleFirstScreen`; `handleNavClick` → `navigate({ to: \`/${screen}\` })` + `onClose()`; active highlight = `location.pathname === \`/${item.s}\``; new `handleRoleChange` → `setCurrentRole` + navigate to `roleFirstScreen`; dropped `curSc`/`setCurSc` (grep gate: zero matches).
- **`src/components/layout/AppShell.tsx`**: `document.title` effect keyed to `location.pathname` + `isLoggedIn`; shows "Sign in — Bomach OS" when logged out.

## Verification results
- `npx tsc --noEmit` — PASS
- `npx vite build` — PASS (843 kB, ~10.4s)
- agent-browser:
  - Login (coord) → `/dashboard`, title "Command centre" ✓
  - Click "Daily execution" → URL `/daily-execution`, title "Daily execution center", screen renders ✓
  - Click "Pipeline" → URL `/pipeline`, title "CRM pipeline", sidebar highlight = Pipeline (bg-navy text-white) ✓
  - Sidebar role select → CEO → URL `/workdesk`, title "My work desk" ✓

## Notes / follow-ups
- Auth is **not persisted** across reload (pre-existing): reload shows LoginScreen even though the URL stays `/pipeline`. URL-derived active highlight is proven while logged in. Persisting auth is out of scope for this phase but could be a future polish item.
