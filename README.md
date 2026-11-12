# Bomach OS Marketing

Bomach OS Marketing is the marketing and revenue operating system frontend for Bomach Group of Company. It is a React, TypeScript, Vite, Tailwind CSS, and TanStack Router application wired to the Bomach backend API.

The app covers the CEO/marketing workspace across workdesk, lead management, campaign operations, revenue execution, governance, operations, enablement, and reporting screens. Most production-facing screens are API-backed and use defensive response transformers because some backend schemas are still broad or evolving.

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- TanStack Router
- npm package manager
- Playwright for E2E smoke tests
- ESLint for static checks

## Shared Host and Authentication

Marketing is independently built and deployed, then served under `/marketing/*` by the Bomach OS front door. Its API client uses same-origin `/api/v1` requests and the shared HTTP-only browser session; Bomach OS owns login, two-factor verification, and session expiry. Do not configure a browser API-origin override or use Marketing's standalone Vercel domain to test shared authentication.

For local shared-host testing, open Marketing through `http://localhost:5173/marketing/...`. The Vite server on port `5177` is the upstream app behind the OS proxy, not the shared-cookie entry point.

The local OpenAPI reference is stored in:

```txt
openapi.yaml
```

Implementation status and backend contract gaps are tracked in:

```txt
IMPLEMENTATION_PROGRESS.md
BACKEND_CONTRACT_GAPS.md
```

## Getting Started

Install dependencies with npm:

```bash
npm install
```

For the full local shared-host flow, run the backend, OS front door, and product apps in separate terminals:

```bash
# Terminal 1: from bomach_os_backend
source .venv/bin/activate
python manage.py runserver

# Terminal 2: from bomach_os_frontend/bomach_os
npm run dev

# Terminal 3: from bomach_os_frontend/marketing
npm run dev:shared

# Optional Terminal 4: from bomach_os_frontend/services
npm run dev:shared
```

Open `http://localhost:5173/marketing/`. The OS Vite server proxies `/api` to Django and `/marketing` to Marketing on port `5177`. Services uses port `5175` in shared mode. The default local browser-auth origins already include `http://localhost:5173` and `http://127.0.0.1:5173` when Django `DEBUG` is enabled.

You can run Marketing alone for component work with `npm run dev:shared`; use the OS front door for end-to-end login, cookies, and app switching.

Build the app:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Run E2E tests:

```bash
npm run test:e2e
```

## Project Structure

```txt
src/
  components/
    layout/          App shell, sidebar, login, permission fallback
    screens/         Feature screens and route views
    shared/          Reusable UI primitives
  context/           Auth, store, toast, and shell state
  data/              Shared data types and legacy defaults
  routes/            TanStack route modules
  services/
    api/             API clients and endpoint wrappers
    transformers/    Defensive backend-to-UI mappers
  utils/             Formatting and search helpers
```

## Main Product Areas

- My Work Desk
- Lead 360 Journal
- CRM Pipeline
- Campaign Operating System
- Content Calendar
- Media Library
- Revenue Command
- Daily Execution
- 13-Week Turnaround
- Lead Control Tower
- Funnel Leak Audit
- Forecast and Coverage
- Compliance
- Operations, Support, Partners, and Analytics
- Team Directory
- Enablement and Growth
- Governance and Campaign Operations

## Auth and Permissions

Marketing bootstraps the current user and permission map from `/api/v1/auth/me`. Navigation and workspace-switcher visibility use those backend grants; backend authorization remains authoritative. Failed unauthenticated requests may refresh the shared browser session once, then return the user to Bomach OS login with the safe Marketing path preserved.

## Development Notes

- Use npm for dependency installation and project scripts.
- Keep backend writes success-first: update UI state only after the API call succeeds.
- Avoid demo or local-only fallback data on production-facing pages.
- Use the Bomach OS front door at `http://localhost:5173` for shared-session testing; opening `http://localhost:5177` directly does not test the shared host.
- Disabled controls usually indicate confirmed backend gaps rather than unfinished UI polish.
- Keep wide tables and matrices scrollable inside their own containers, not at the body level.

## Validation Checklist

Before pushing material frontend changes:

```bash
npm run build
npm run lint
```

## Repository

GitHub remote:

```txt
https://github.com/bomach-group-company/marketing.git
```
