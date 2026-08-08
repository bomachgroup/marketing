# Backend Contract Gaps

Last updated: 2026-08-05

This file tracks endpoints that are blocked, weakly typed, or intentionally not wired because the existing UI does not expose a matching workflow. It is not a bug list for empty backend data.

## Working Rules

- Do not add UI solely to consume an endpoint.
- Do not replace stable multi-endpoint pages with weak aggregate endpoints without a confirmed response sample.
- Failed writes must not mutate local UI state.
- Missing-data reads should ideally return an empty 200 response instead of a 404 when the requesting user is valid.

## Weak Or Missing Response Schemas

These endpoints are implemented defensively or deferred because OpenAPI does not provide a precise response shape.

- `GET /api/v1/revenue-execution/lead-control`
  - UI usage: Lead Control Tower KPI cards, rows, scoring model, qualification checklist.
  - Needed: stable response schema for `kpi_cards`, `rows`, `scoring_model`, and `qualification_checklist`.
- `GET /api/v1/revenue-execution/forecast`
  - UI usage: Forecast cards, quality controls, division forecast rows.
  - Needed: stable response schema for summary, controls, division rows, target gap, and confidence fields.
- `GET /api/v1/revenue-execution/funnel-audit`
  - UI usage: Funnel leak audit rows, KPIs, stage analysis.
  - Needed: stable response schema for cards, rows, stage summaries, and recommended actions.
- `GET /api/v1/revenue-execution/command-center`
  - UI usage: not currently wired. The Command Centre screen uses confirmed narrower endpoints instead.
  - Needed: real response sample and schema before using it as a page aggregate.
- `GET /api/v1/marketing/traditional-media/placements/export`
  - UI usage: export for traditional media placements.
  - Needed: response contract for file URL, binary response, or job status.
- `GET /api/v1/marketing/meetings/export`
  - UI usage: Marketing Meetings export button.
  - Needed: response contract for file URL, binary response, or job status.
- `GET /api/v1/marketing/meetings`
  - UI usage: Marketing Meetings cards plus action and decision tabs.
  - Needed: stable list schema for meetings, embedded `actions`, embedded `decisions`, and count/pagination metadata.
- `GET /api/v1/revenue-execution/playbooks/current`
  - UI usage: Sales Playbooks strict current-playbook lookup.
  - Needed: return a 200 empty response for no active playbook, or document 404 as the official empty-state contract.
- `GET /api/v1/marketing/partner-portal/session`
  - UI usage: external partner portal context, not the internal CEO Partner Work Portal.
  - Needed: documented token source/transport for partner portal sessions, separate from the normal app JWT if required.

## Missing Backend Endpoints

These UI areas remain disabled or documented as backend gaps because no OpenAPI-confirmed endpoint exists.

- Channel Integrations: integration config/status/test/sync endpoints.
- WhatsApp: real inbox, reply, broadcast, and template endpoints.
- Email deliverability: live domain/SPF/DKIM/DMARC/bounce/reputation status endpoint.
- Audit log export: export endpoint for the current Audit Log screen.
- Referral campaign launch and dormant reactivation workflows.
- Huddle/rhythm workflows outside currently implemented Daily Execution actions.
- Report PDF/share/custom export workflows.
- Support reply/message endpoint.

## Missing-Data 404s To Normalize

These endpoints can return 404 for valid authenticated users when no record exists. The UI handles or avoids them where possible, but a 200 empty-state response would simplify the client.

- `GET /api/v1/roles/me/description`
- Dated Daily Execution day reads when the selected date has no `DailyExecutionDay`; the UI avoids blind day probes where summary data does not indicate an existing day.
- `GET /api/v1/revenue-execution/turnaround/plans/active` when no active plan exists; the UI now uses `GET /api/v1/revenue-execution/turnaround/plans?status=active`.
- `GET /api/v1/revenue-execution/playbooks/current` when no active playbook exists for the selected filters.
