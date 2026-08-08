# 01-02 SUMMARY — Route remaining navigation call sites; remove legacy `curSc`

**Phase:** 01-nav-routing · **Plan:** 02 · **Status:** DONE · **Date:** 2026-07-31

## Objective (from plan)
Remove the legacy `curSc`/`setCurSc` screen-state entirely and finish routing every remaining `goSc`-style navigation call site: login landing, header lead search, pipeline lead cards, journal lead sync, and the dashboard role select.

## Evidence of completion
- **Grep gate:** `curSc` → **zero matches** across all of `src/` (only references in `.planning/` docs remain).
- **`npx tsc --noEmit`:** PASS (after each task and at the end).
- **`npx vite build`:** PASS (~8s, same 843KB / chunk-warning as before — no new issues).
- **Grep gate:** `/leads/$id` (the non-existent route) → **zero matches** in `src/`.

## Changes made
### Task 1 — Remove `curSc` and route login (atomic)
- `src/context/StoreContext.tsx`: removed `curSc: string` from `StoreState`, `setCurSc` from `StoreContextValue`, `curSc: 'dashboard'` from `seedState()`, and `setCurSc: makeSetter('curSc')` from setters. `activeJournalLead`/`setActiveJournalLead` retained (now consumed).
- `src/components/layout/LoginScreen.tsx`: dropped `useStore`/`setCurSc`; added `useNavigate` + `roleFirstScreen`; `handleLogin` now calls `navigate({ to: \`/${roleFirstScreen(selectedRole)}\` })`.
- `src/components/screens/WorkdeskPage.tsx`: removed dead `curSc, setCurSc` destructure (unused).

### Task 2 — Header lead search → `/leads-detail` + journal sync
- `src/components/layout/TopHeader.tsx`: store destructure now uses `setActiveJournalLead`; `handleSelectLead` finds the lead, calls `setActiveJournalLead(lead)`, then `navigate({ to: '/leads-detail', search: { id } })` and clears search.
- `src/components/screens/LeadJournalPage.tsx`: `selectedLead` initializer = `activeJournalLead` (pre-select); `handleSelect` also calls `setActiveJournalLead(l)` to keep search + manual selection in sync.

### Task 3 — Pipeline card route + dashboard role select
- `src/components/screens/pipeline/PipelinePage.tsx:96`: lead card click now `navigate({ to: '/leads-detail', search: { id: l.id } })` (was broken `/leads/$id`).
- `src/components/screens/dashboard/DashboardPage.tsx`: role select `onChange` also `navigate({ to: \`/${roleFirstScreen(e.target.value)}\` })`.

## Manual verification (agent-browser, dev server)
| Check | Result |
|-------|--------|
| Sign in as Analyst | URL → `/revenue-command`, title "Revenue recovery command" |
| Header search "Adaeze" → click `L-2247 Adaeze Chukwu` | URL → `/leads-detail?id=L-2247`, title "Lead detail" |
| Sidebar role switch analyst → CEO | URL → `/workdesk`, title "My work desk" |
| Sidebar → "Lead 360 journal" | URL → `/lead-journal`; page shows `Adaeze Chukwu` + `L-2247` (pre-selected from `activeJournalLead`) |
| Sidebar → "CRM Pipeline" | URL → `/pipeline`; lead card `AC Adaeze Chukwu ... ₦4.5M` rendered |
| Click pipeline card | URL → `/leads-detail?id=L-2247`, detail shows Adaeze Chukwu |
| Sidebar → "Command centre" | URL → `/dashboard` |
| Dashboard role select → Partner Manager | URL → `/workdesk`, title "My work desk" (Partner's first screen) |

Note: `agent-browser goto` (full page load) wipes the in-memory store since auth isn't persisted — the journal pre-select was verified via in-SPA navigation (search → role switch → journal) which preserves state, matching how the port behaves at runtime.

## Success criteria met
- [x] Legacy `curSc`/`setCurSc` fully removed (grep-verified zero in `src/`)
- [x] Every `goSc`-style navigation call site is router-driven and lands on a real route
- [x] Build green throughout (`tsc` clean after each task)

## Notes / follow-ups
- `PartnerPortalPage` decision still open (Plan 01-03): nav references `s:"partner-portal"` but only `realtor-portal` exists as a route/component.
- Auth is still not persisted across reload (pre-existing gap, outside this phase scope).
