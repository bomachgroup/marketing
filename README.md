# Bomach OS Marketing

Bomach OS Marketing is the marketing and revenue operating system frontend for Bomach Group of Company. It is a React, TypeScript, Vite, Tailwind CSS, and TanStack Router application wired to the Bomach backend API.

The app covers the CEO/marketing workspace across workdesk, lead management, campaign operations, revenue execution, governance, operations, enablement, and reporting screens. Most production-facing screens are API-backed and use defensive response transformers because some backend schemas are still broad or evolving.

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- TanStack Router
- Bun package manager
- Playwright for E2E smoke tests
- ESLint for static checks

## Backend

The API client defaults to:

```txt
https://bomachauthtest.bgbot.app
```

Override it with:

```env
VITE_API_BASE_URL=https://your-api-host
```

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

Install dependencies with Bun:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Build the app:

```bash
bun run build
```

Run lint:

```bash
bun run lint
```

Run E2E tests:

```bash
bun run test:e2e
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

Authentication is JWT-based. Access and refresh tokens are stored through the app token store and attached by `src/services/api/apiClient.ts`.

Navigation is permission-aware. Sidebar routes are filtered through `src/navigation.ts`, using the authenticated role and backend permission map so users should only see pages they can access.

## Development Notes

- Use Bun for dependency installation and project scripts.
- Do not use `npm install`; the project enforces Bun during install.
- Keep backend writes success-first: update UI state only after the API call succeeds.
- Avoid demo or local-only fallback data on production-facing pages.
- Disabled controls usually indicate confirmed backend gaps rather than unfinished UI polish.
- Keep wide tables and matrices scrollable inside their own containers, not at the body level.

## Validation Checklist

Before pushing material frontend changes:

```bash
bun run build
bun run lint
```

When Bun is unavailable in the local shell, the equivalent local binaries are:

```bash
.\node_modules\.bin\tsc.cmd -b --noEmit --pretty false
.\node_modules\.bin\eslint.cmd .
```

## Repository

GitHub remote:

```txt
https://github.com/bomach-group-company/marketing.git
```
