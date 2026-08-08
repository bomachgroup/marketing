# Bomach OS Marketing API Progress

Last updated: 2026-08-05

This tracker only covers the pages currently in scope. Each `Remaining APIs` section means unimplemented endpoints or API-backed workflows, not general UI cleanup.

## Working Rules

- API writes must succeed before local UI state changes.
- Parse backend errors before showing them in toasts, dialogs, banners, or inline messages.
- Prefer OpenAPI-confirmed endpoints and schemas.
- Use `bun run tsc -b --noEmit` for type checks. Do not run `npm run build`; use `bun build` only when necessary.
- Remaining API categories: `Actionable Now` can be wired into existing controls; `Deferred UI` needs a future product workflow; `Used Elsewhere` is already implemented on another page; `Redundant/Superseded` is intentionally not used because a richer or safer endpoint already drives the UI; `Backend Gap` needs backend endpoints, schemas, or missing-record behavior fixed first.

## My Work Desk

File: `src/components/screens/WorkdeskPage.tsx`

### Implemented APIs

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/performance-card`
- `GET /api/v1/roles/me/daily-routine`
- `GET /api/v1/roles/me/sops`
- `GET /api/v1/employees/unit`
- `GET /api/v1/employees/me/kpis`
- `GET /api/v1/employees/me/targets`
- `GET /api/v1/target-reports/me`
- `POST /api/v1/target-reports/`

### API Notes

- KPI rows, target rows, and recent target reports are now shown inside existing Workdesk performance/report areas.
- `POST /api/v1/target-reports/` must succeed before the local close-of-day submitted state is updated.
- `GET /api/v1/roles/me/description` is not auto-called here because the backend returns 404 when no role-description record exists; SOPs remain the role-obligation source.

### Remaining APIs

- None for the current Workdesk UI.

## Lead 360 Journal

File: `src/components/screens/LeadJournalPage.tsx`

### Implemented APIs

- `GET /api/v1/leads/{lead_id}/activities`
- `POST /api/v1/leads/{lead_id}/activities`
- `PATCH /api/v1/leads/{lead_id}/activities/{activity_id}`
- `PATCH /api/v1/leads/{lead_id}`

### API Notes

- Activity reads, activity edits, and lead writes are gated to IDs loaded from the backend lead list, so local/UI-only lead IDs do not call `/api/v1/leads/{lead_id}/activities`.
- Lead edit source values are restricted to backend-accepted source choices currently exposed in the UI.

### Remaining APIs

- None for the current Lead 360 Journal UI.

## Lead Detail

File: `src/components/screens/LeadsDetailPage.tsx`

### Implemented APIs

- `POST /api/v1/leads/{lead_id}/activities`
- `PATCH /api/v1/leads/{lead_id}/status`

### API Notes

- Log Note, Log Voice Call, WhatsApp Note, and Schedule Meeting now open a shared activity dialog and create backend lead activities only after API success.
- Stage changes and activity saves are gated to real backend numeric lead IDs.
- The old direct `lead.activities.unshift(...)` mutation was removed.

### Remaining APIs

- No additional Lead Detail APIs are used by the current page controls.

## Channel Integrations

File: `src/components/screens/IntegrationsPage.tsx`

### Implemented APIs

- None. Reviewed against OpenAPI, but backend developer confirmed channel integration endpoints are not ready yet.

### Remaining APIs

- Waiting for backend integration config/status/test/sync endpoints.

## CRM Pipeline

File: `src/components/screens/pipeline/PipelinePage.tsx`

### Implemented APIs

- `GET /api/v1/leads/pipeline`

### API Notes

- Pipeline cards, stages, row counts, lead value, SLA/overdue state, owner, score, and next action are mapped from backend data only.
- Division and period filters are sent as query params.
- The page uses a wrapped responsive grid so it does not require body-level horizontal scrolling.

### Remaining APIs

#### Redundant/Superseded

- `GET /api/v1/leads/pipeline/{lead_id}` is wrapped but not used because the existing Pipeline UI opens the existing Lead Detail route.

#### Used Elsewhere

- `PATCH /api/v1/leads/{lead_id}/status` is implemented in Lead Detail and Lead Control; Pipeline still has no drag/drop or stage-change control.

## Campaigns

File: `src/components/screens/campaigns/CampaignsPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing-campaigns/panel`
- `GET /api/v1/marketing-campaigns/requests`
- `POST /api/v1/marketing-campaigns/requests`
- `GET /api/v1/marketing-campaigns/{campaign_id}/workspace`
- `POST /api/v1/marketing-campaigns`
- `PUT /api/v1/marketing-campaigns/{campaign_id}` for the existing Pause/Resume action
- `POST /api/v1/marketing-campaigns/{campaign_id}/tasks`
- `PATCH /api/v1/marketing-campaigns/tasks/{task_id}`
- `POST /api/v1/marketing-campaigns/{campaign_id}/updates`
- `POST /api/v1/marketing-campaigns/{campaign_id}/expenses`
- `POST /api/v1/marketing-campaigns/{campaign_id}/assets`
- `POST /api/v1/marketing-campaigns/{campaign_id}/decisions`

### API Notes

- Campaign create/request division values are normalized to backend choices before submission.
- The fake duplicate helper was removed because OpenAPI does not expose a duplicate endpoint.

### Remaining APIs

#### Redundant/Superseded

- `GET /api/v1/marketing-campaigns`, `GET /api/v1/marketing-campaigns/status/{status}`, `GET /api/v1/marketing-campaigns/channel/{channel}`, and `GET /api/v1/marketing-campaigns/{campaign_id}` remain unused because the current Campaigns page uses the richer panel and workspace endpoints.

#### Deferred UI

- `DELETE /api/v1/marketing-campaigns/{campaign_id}` is not implemented because the existing UI has no delete control.
- `GET /api/v1/marketing-campaigns/panel/export` is wrapped but not wired because the current Campaigns page has no visible export button.
- `PATCH /api/v1/marketing-campaigns/requests/{request_id}` and `POST /api/v1/marketing-campaigns/requests/{request_id}/convert` are wrapped but not exposed because the current request list has no review/convert controls.
- `PATCH /api/v1/marketing-campaigns/assets/{asset_id}` is wrapped but not exposed because the current workspace only creates assets.
- `POST /api/v1/marketing-campaigns/{campaign_id}/risks`, `PATCH /api/v1/marketing-campaigns/risks/{risk_id}`, and `PUT /api/v1/marketing-campaigns/{campaign_id}/post-analysis` are wrapped but not exposed because the current workspace UI has no risk or post-analysis controls.

## Content Calendar

File: `src/components/screens/CalendarPage.tsx`

### Implemented APIs

- `GET /api/v1/content/calendar`
- `POST /api/v1/content/calendar/briefs`
- `PATCH /api/v1/content/calendar/briefs/{item_id}`
- `POST /api/v1/content/calendar/briefs/{item_id}/publish`

### API Notes

- Calendar week grid, backend label, KPI counts, deliverable rows, published label, target count, overdue count, current-day flag, and metadata options are mapped from backend data only.
- Prev/Next week controls update the `week_start` query param.
- Brief creation and editing use OpenAPI fields: `title`, `format`, `platform`, `division`, `due_date`, `description`, `status`, and `funnel_stage`.
- Calendar item rows expose Edit and Publish actions only when a backend item ID is present.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/content/calendar/export` is wrapped but not wired because the current page has no export button.

## Media Library

File: `src/components/screens/media/MediaLibraryPage.tsx`

### Implemented APIs

- `GET /api/v1/content/media-library`
- `POST /api/v1/others/upload-file`
- `POST /api/v1/content/media-library/assets`
- `GET /api/v1/content/media-library/assets/{asset_id}`
- `PATCH /api/v1/content/media-library/assets/{asset_id}`

### API Notes

- Asset cards, total/active/archived counts, storage summary, type counts, metadata options, detail modal, owner, status, size, file URL, and thumbnails are mapped from backend data only.
- Asset creation uploads binaries through `POST /api/v1/others/upload-file` when a file is selected, then stores the returned URL through `POST /api/v1/content/media-library/assets`.
- Asset detail modal now edits metadata through the backend and refreshes only after success.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/content/media-library/export` is wrapped but not wired because the current page has no export button.

## WhatsApp

File: `src/components/screens/WhatsAppPage.tsx`

### Implemented APIs

- `GET /api/v1/csrc/inquiries?source=whatsapp`

### API Notes

- The WhatsApp page now acts as a limited WhatsApp inquiry inbox backed by CSRC inquiry data.
- Reply, Broadcast, and Templates are disabled because OpenAPI does not expose WhatsApp inbox/reply/broadcast/template endpoints.

### Remaining APIs

#### Backend Gap

- No confirmed backend endpoint exists for WhatsApp message reply/send.
- No confirmed backend endpoint exists for WhatsApp broadcast creation or delivery.
- No confirmed backend endpoint exists for WhatsApp template listing, approval status, or template send.

## Partners & Media

File: `src/components/screens/PartnersPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/partners/dashboard`
- `GET /api/v1/marketing/partners/directory`
- `POST /api/v1/marketing/partners/invitations`
- `GET /api/v1/marketing/traditional-media/placements`

### API Notes

- Realtors and Influencers tabs are loaded from partner directory filters.
- Billboards and Radio / TV tabs are loaded from traditional media placement filters.
- Add partner creates a partner invitation and only refreshes UI state after API success.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/marketing/partners/tasks`, `POST /api/v1/marketing/partners/tasks`, and `PATCH /api/v1/marketing/partners/tasks/{task_id}` are wrapped but not exposed because the visible Partners & media page has no partner task panel.
- `GET /api/v1/marketing/partners/reports` and `PATCH /api/v1/marketing/partners/reports/{report_id}/review` are wrapped but not exposed because the visible page has no report review panel.
- `GET /api/v1/marketing/partners/commissions`, `POST /api/v1/marketing/partners/commissions`, `PATCH /api/v1/marketing/partners/commissions/{commission_id}/approve`, and `PATCH /api/v1/marketing/partners/commissions/{commission_id}/mark-paid` are wrapped but not exposed because the visible page has no commission workflow.

#### Used Elsewhere

- `GET /api/v1/marketing/traditional-media/dashboard`, `POST /api/v1/marketing/traditional-media/placements`, `GET /api/v1/marketing/traditional-media/placements/{placement_id}`, `PATCH /api/v1/marketing/traditional-media/placements/{placement_id}`, and `GET /api/v1/marketing/traditional-media/placements/export` are implemented by the Traditional Media Register page, so they are intentionally not duplicated on Partners & media.

## Email Marketing

File: `src/components/screens/EmailCenterPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/email/audiences`
- `GET /api/v1/marketing/email/campaigns`
- `POST /api/v1/marketing/email/preview`
- `POST /api/v1/marketing/email/send`

### API Notes

- Audience options and campaign history are mapped from backend responses only.
- Email metrics are derived from backend campaign rows.
- Deliverability and consent controls are shown only as unverified requirements because OpenAPI does not expose a deliverability status endpoint.
- Send clears the subject and body only after backend success.
- Preview and Send parse backend errors before showing toasts.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/marketing/email/campaigns/{campaign_id}` is wrapped but not exposed because the current page has no campaign detail drawer.

#### Backend Gap

- No confirmed email export endpoint exists, so Export report is disabled instead of running a toast-only action.

## Traditional Media Register

File: `src/components/screens/MediaRegisterPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/traditional-media/dashboard`
- `GET /api/v1/marketing/traditional-media/placements`
- `POST /api/v1/marketing/traditional-media/placements`
- `PATCH /api/v1/marketing/traditional-media/placements/{placement_id}`
- `GET /api/v1/marketing/traditional-media/placements/export`

### API Notes

- KPI cards and placement rows are mapped from backend data only.
- Placement create/edit writes to the backend and refreshes only after success.
- Placement writes now trim text fields and send optional blanks as `null` where the OpenAPI schema allows nullable values.
- The old Renew local-only action is replaced by the backend edit workflow.
- Export calls the backend and handles success defensively because OpenAPI does not declare a concrete export response schema.

### Remaining APIs

#### Redundant/Superseded

- `GET /api/v1/marketing/traditional-media/placements/{placement_id}` is wrapped but not exposed because the edit modal can use the row data currently shown in the table.

## Sales Handoffs

File: `src/components/screens/HandoffPage.tsx`

### Implemented APIs

- `GET /api/v1/orders`

### API Notes

- The page now shows service orders as read-only operational handoffs.
- Create handoff, complete stage, and open client file controls are disabled because OpenAPI does not expose a confirmed sales handoff workflow endpoint.
- Service order status and payment status are defensively mapped into the existing handoff milestone display.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/orders/{order_id}` is wrapped but not exposed because the current page has no order detail drawer.

#### Backend Gap

- `POST /api/v1/orders` and `PUT /api/v1/orders/{order_id}` are not wired because the current handoff UI does not collect required backend IDs such as `client_id`, `service_id`, and `created_by_id`, and handoff stage values are not confirmed order statuses.

## External Realtors

File: `src/components/screens/RealtorPortalPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/partners/dashboard`
- `GET /api/v1/marketing/partners/directory?category=real_estate`
- `POST /api/v1/marketing/partners/invitations`
- `GET /api/v1/marketing/partners/tasks?partner_type=real_estate`
- `PATCH /api/v1/marketing/partners/tasks/{task_id}`
- `GET /api/v1/marketing/partners/commissions`
- `PATCH /api/v1/marketing/partners/commissions/{commission_id}/approve`
- `PATCH /api/v1/marketing/partners/commissions/{commission_id}/mark-paid`
- `POST /api/v1/marketing/partners/referred-leads`

### API Notes

- Realtor directory, assigned tasks, and commission ledger are backend-backed.
- Add realtor creates a partner invitation and requires email because OpenAPI requires it.
- Referred leads are submitted through the partner referred lead endpoint.
- Referred lead estimated value is validated before the API call and sent as a number.
- Task completion and commission pay workflows only run when backend IDs are present.

### Remaining APIs

#### Deferred UI

- `POST /api/v1/marketing/partners/tasks` is wrapped but not exposed on this page because realtor task creation is handled in the Partner Work Portal workflow.
- `POST /api/v1/marketing/partners/commissions` is wrapped but not exposed because the current visible page has no commission creation form.

## Partner Work Portal

File: `src/components/screens/PartnerPortalPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/partners/directory`
- `GET /api/v1/marketing/partners/tasks`
- `POST /api/v1/marketing/partners/tasks`
- `GET /api/v1/marketing/partners/reports`
- `POST /api/v1/marketing/partner-portal/reports`
- `PATCH /api/v1/marketing/partners/reports/{report_id}/review`

### API Notes

- Assigned tasks, report rows, metrics, and task brief modal content are backend-backed.
- Partner report submission requires a backend `task_id`.
- Report approval requires a backend `report_id`.
- `GET /api/v1/marketing/partner-portal/session` is intentionally not called from this internal CEO page because it returns 401 when the current app session is not a partner portal token.

### Remaining APIs

#### Backend Gap

- `GET /api/v1/marketing/partner-portal/session` is reserved for a true external partner portal context.

#### Used Elsewhere

- `POST /api/v1/marketing/partner-portal/leads` is wrapped but not exposed because this page currently handles reports and tasks, while referred lead registration is represented in External Realtors.

#### Deferred UI

- `PATCH /api/v1/marketing/partners/tasks/{task_id}` is wrapped but not exposed in this page because the current visible partner task panel has no task-edit controls.

## Analytics

File: `src/components/screens/analytics/AnalyticsPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/analytics`

### API Notes

- KPI cards, chart bars, and target-vs-actual rows are mapped from the backend response only.
- Existing tabs are preserved as view filters/layout context without adding non-backed actions.

### Remaining APIs

#### Redundant/Superseded

- No additional Analytics-specific operations endpoints are currently exposed in OpenAPI for this page.

## Support

File: `src/components/screens/support/SupportPage.tsx`

### Implemented APIs

- `GET /api/v1/csrc/inquiries`
- `POST /api/v1/csrc/inquiries`
- `PATCH /api/v1/csrc/inquiries/{inquiry_id}/status`

### API Notes

- Support KPI cards use CSRC inquiry summary fields: `total`, `new_count`, `pending_followups`, and `avg_response_time`.
- Reply is disabled because OpenAPI does not expose a support reply/message endpoint.
- Escalate is disabled, not toast-only, because the current page has no real backend `agent_id` selector.

### Remaining APIs

#### Deferred UI

- `PATCH /api/v1/csrc/inquiries/{inquiry_id}` is wrapped but not exposed because the current Support page has no edit form.
- `POST /api/v1/csrc/inquiries/{inquiry_id}/assign` is wrapped but not exposed because the current Support page has no backend agent selector.
- `GET /api/v1/csrc/inquiries/missed` is wrapped but not exposed because the current Support page has no missed-inquiries panel.
- `GET /api/v1/csrc/followups`, `POST /api/v1/csrc/followups`, and `PATCH /api/v1/csrc/followups/{followup_id}` are wrapped but not exposed because the current Support page has no follow-up panel.

## Team Directory

File: `src/components/screens/team-directory/TeamDirectoryPage.tsx`

### Implemented APIs

- `GET /api/v1/employees/employees`
- `GET /api/v1/roles/employees/{user_id}`
- `GET /api/v1/employees/department`
- `GET /api/v1/employees/unit`

### API Notes

- Team member cards now use backend employee rows only.
- Team member click opens a read-only role detail drawer from `/api/v1/roles/employees/{user_id}` so role, branch scope, and permission coverage come from the confirmed role endpoint.
- KPI cards use employee, department, and unit response counts.
- The page shows active/inactive employee state from `is_active`; it does not fake online presence.

### Remaining APIs

#### Deferred UI

- `POST /api/v1/employees/employees` and `PUT /api/v1/employees/employees/{user_id}` are not exposed because the current page has no employee create/edit form.
- `POST /api/v1/employees/exit/{user_id}` is not exposed because the current page has no offboarding control.
- `POST /api/v1/employees/{user_id}/documents`, `GET /api/v1/employees/{user_id}/documents`, and `DELETE /api/v1/employees/{user_id}/documents/{doc_id}` are not exposed because the current page has no employee document panel.
- `POST /api/v1/employees/{user_id}/reviews`, `GET /api/v1/employees/{user_id}/reviews`, and `PUT /api/v1/employees/reviews/{review_id}` are not exposed because the current page has no employee review panel.
- `POST /api/v1/employees/department`, `PUT /api/v1/employees/department/{department_id}`, `POST /api/v1/employees/unit`, and `PUT /api/v1/employees/unit/{unit_id}` are not exposed because the current page has no department/unit administration controls.

## New Lead

File: `src/components/screens/new-lead/NewLeadPage.tsx`

### Implemented APIs

- `POST /api/v1/leads`
- `GET /api/v1/employees/employees?is_active=true`
- `GET /api/v1/marketing-campaigns`

### API Notes

- Division defaults and select values now use backend-safe values like `real_estate`, `benji`, and `engineering`.
- Lead source no longer submits invalid local values such as `social_media`; unsupported source labels are not shown.
- Assignment uses real backend employee IDs when available and otherwise submits the lead as unassigned.
- Linked campaign uses real campaign IDs when the backend returns campaigns and otherwise submits no campaign.

### Remaining APIs

#### Redundant/Superseded

- No additional OpenAPI-confirmed endpoint is naturally represented by the current New Lead form.

## Sales Playbooks

File: `src/components/screens/PlaybooksPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/playbooks`

### API Notes

- Division, conversation stage, and customer type filters are passed to the backend as `division`, `stage`, and `persona`.
- The guide and objection library now render backend playbook data only.
- Copy current guide remains a local clipboard action and is disabled when no backend playbook is selected.
- The page uses the filtered list endpoint for empty-safe discovery. `GET /api/v1/revenue-execution/playbooks/current` is intentionally not auto-called because a missing active playbook returns a normal 404 empty-state response.

### Remaining APIs

#### Backend Gap

- `GET /api/v1/revenue-execution/playbooks/current` is wrapped but not auto-called from the page until the backend returns an empty 200 for missing active playbooks or the UI needs a strict current-playbook lookup.

#### Deferred UI

- `POST /api/v1/revenue-execution/playbooks`, `PUT /api/v1/revenue-execution/playbooks/{playbook_id}`, and `DELETE /api/v1/revenue-execution/playbooks/{playbook_id}` are wrapped but not exposed because the current Playbooks page has no create/edit/archive controls.
- `POST /api/v1/revenue-execution/playbooks/{playbook_id}/objections`, `PATCH /api/v1/revenue-execution/playbooks/objections/{objection_id}`, and `DELETE /api/v1/revenue-execution/playbooks/objections/{objection_id}` are wrapped but not exposed because the current objection library has no objection edit controls.

## Content Revenue Studio

File: `src/components/screens/ContentStudioPage.tsx`

### Implemented APIs

- `GET /api/v1/content`
- `POST /api/v1/content`
- `GET /api/v1/employees/employees?is_active=true`

### API Notes

- Metrics, production board columns, and content intelligence rows now derive from backend content rows.
- Create brief creates a backend content item and refreshes only after API success.
- Owner selection uses real backend employee IDs when available and otherwise submits unassigned.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/content/{content_id}` and `PUT /api/v1/content/{content_id}` are wrapped but not exposed because the current page has no content detail/edit drawer.
- `GET /api/v1/content/scheduled/upcoming` is wrapped but not exposed because the current page has no upcoming-content panel.
- `POST /api/v1/content/{content_id}/increment-views`, `POST /api/v1/content/{content_id}/increment-likes`, `POST /api/v1/content/{content_id}/increment-shares`, and `POST /api/v1/content/{content_id}/increment-comments` are not exposed because the current page has no engagement action controls.

#### Redundant/Superseded

- `GET /api/v1/content/slug/{slug}`, `GET /api/v1/content/author/{author_id}/content`, and `GET /api/v1/content/platform/{platform}/content` are not exposed because the current page filters from the main content list.

## Design & Creative Board

File: `src/components/screens/design/DesignPage.tsx`

### Implemented APIs

- None. No confirmed design brief/task workflow endpoint is currently wired.

### API Notes

- The old `DEFAULT_DESIGN_TASKS` fallback and local task mutation workflow were removed.
- New design brief and task movement controls are disabled until confirmed backend endpoints exist.

### Remaining APIs

#### Backend Gap

- Waiting for backend-confirmed design brief/task list, create, status-update, and review endpoints.

## Coaching

File: `src/components/screens/CoachingPage.tsx`

### Implemented APIs

- `GET /api/v1/training-programs/`
- `POST /api/v1/training-programs/`
- `PATCH /api/v1/training-programs/{program_id}/status`
- `GET /api/v1/employees/employees?is_active=true`

### API Notes

- Coaching metrics, matrix, session rows, and drill rows now use backend training programs.
- Schedule session creates a backend training program and refreshes only after API success.
- Complete and Start actions update the training program status through the backend.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/training-programs/{program_id}`, `PUT /api/v1/training-programs/{program_id}`, and `DELETE /api/v1/training-programs/{program_id}` are wrapped but not exposed because the current Coaching page has no program detail/edit/delete controls.
- Role training requirement endpoints under `/api/v1/roles/.../training-requirements` are not exposed because the current Coaching page does not manage role training requirements.

## Retention & Referrals

File: `src/components/screens/RetentionPage.tsx`

### Implemented APIs

- `GET /api/v1/leads?source=referral`
- `GET /api/v1/leads?status=nurturing`

### API Notes

- Referral opportunities are loaded from backend leads with the referral source filter.
- Dormant/reactivation candidates are read from backend leads with the existing nurturing status filter.
- Launch referral campaign and Reactivate are disabled because OpenAPI does not expose confirmed referral campaign launch or reactivation action endpoints.

### Remaining APIs

#### Deferred UI

- `POST /api/v1/marketing/partners/referred-leads` is confirmed but not exposed because the current page has no partner-referred-lead create form.

#### Backend Gap

- No confirmed backend endpoint exists for launching referral campaigns.
- No confirmed backend endpoint exists for one-click dormant lead reactivation.
- No confirmed backend endpoint exists for retention lifecycle/CSAT metrics.

## Command Centre

File: `src/components/screens/dashboard/DashboardPage.tsx`

### Implemented APIs

- `GET /api/v1/leads/summary`
- `GET /api/v1/leads`
- `GET /api/v1/pipeline/reports`
- `GET /api/v1/revenue-execution/targets/summary`
- `GET /api/v1/dashboard/performance-card`
- `GET /api/v1/revenue-execution/activity-scorecard`
- `GET /api/v1/revenue-execution/okrs`
- `GET /api/v1/approvals/requests`
- `GET /api/v1/content/calendar`

### Remaining APIs

#### Used Elsewhere

- `GET /api/v1/dashboard/summary` is already used by My Work Desk but not by Command Centre because the current Command Centre UI does not display the current user's dashboard identity card.

#### Redundant/Superseded

- `GET /api/v1/dashboard/overview` is not implemented in Command Centre because its OpenAPI schema is HR dashboard stats, not the existing marketing/revenue widgets.
- `GET /api/v1/dashboard/stats` and `GET /api/v1/stats/dashboard` are not implemented in Command Centre because their schemas are operations/project stats, not the existing marketing/revenue widgets.
- `GET /api/v1/stats` is not implemented in Command Centre because its schema is service stats, not the existing marketing/revenue widgets.

## OKRs & Targets

File: `src/components/screens/OkrsPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/okrs`
- `GET /api/v1/revenue-execution/targets/summary`
- `PATCH /api/v1/revenue-execution/okrs/key-results/{key_result_id}`

### Remaining APIs

#### Deferred UI

- `POST /api/v1/revenue-execution/okrs` is not implemented because the existing OKRs page does not expose objective creation.
- `POST /api/v1/revenue-execution/okrs/{objective_id}/key-results` is not implemented because the existing OKRs page does not expose adding key results.
- `PATCH /api/v1/revenue-execution/okrs/{objective_id}` is wrapped but not implemented in the UI because the existing OKRs page does not expose objective editing.

## Reports

File: `src/components/screens/ReportsPage.tsx`

### Implemented APIs

- `GET /api/v1/leads/summary`
- `GET /api/v1/leads`
- `GET /api/v1/pipeline/reports`
- `GET /api/v1/revenue-execution/targets/summary`
- `GET /api/v1/revenue-execution/okrs`
- `GET /api/v1/revenue-execution/activity-scorecard`
- `GET /api/v1/content/calendar`
- `GET /api/v1/target-reports/me`

### Remaining APIs

#### Deferred UI

- `GET /api/v1/target-reports/` is not implemented because the existing Reports page shows the current user's report history, not organization-wide report administration.
- `GET /api/v1/target-reports/{report_id}` is not implemented because the existing Reports page does not expose a report-detail view.
- `POST /api/v1/target-reports/{report_id}/approve` is not implemented because the existing Reports page does not expose report approval actions.
- `POST /api/v1/target-reports/{report_id}/reject` is not implemented because the existing Reports page does not expose report rejection actions.

#### Backend Gap

- No confirmed backend endpoint exists for the old Export PDF, Share with team, or custom report export actions, so those fake actions were not retained as active workflows.

## Revenue Command

File: `src/components/screens/revenue/RevenueCommandPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/summary`
- `GET /api/v1/pipeline/reports?period=30`
- `GET /api/v1/funnel/summary`
- `GET /api/v1/revenue-execution/speed-to-lead-queue`
- `GET /api/v1/revenue-execution/activity-scorecard`
- `POST /api/v1/revenue-execution/actions/{action_id}/complete`
- `POST /api/v1/revenue-execution/actions/{action_id}/reopen`

### API Notes

- Revenue Command no longer calls `GET /api/v1/revenue-execution/days/today` as a task-preview probe, because missing DailyExecutionDay records return a normal 404.
- The daily task checklist now renders an explicit backend-empty state when no confirmed task/action rows are available, instead of implying local task data was loaded.

### Remaining APIs

#### Backend Gap

- `GET /api/v1/revenue-execution/command-center` is not implemented in the UI because the response schema is not confirmed enough for reliable field mapping.
- `GET /api/v1/revenue-execution/forecast` is not implemented in the UI because the response schema is not confirmed enough for reliable field mapping.
- `GET /api/v1/revenue-execution/funnel-audit` is not implemented in Revenue Command because the response schema is not confirmed enough for reliable field mapping.
- No confirmed endpoint currently provides active pipeline total and qualified pipeline values for the Revenue Command cards.

## Daily Execution

File: `src/components/screens/revenue/DailyExecutionPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/summary`
- `GET /api/v1/revenue-execution/days/today`
- `GET /api/v1/revenue-execution/days/{day_date}`
- `POST /api/v1/revenue-execution/days/open`
- `PATCH /api/v1/revenue-execution/actions/{action_id}`
- `POST /api/v1/revenue-execution/actions/{action_id}/complete`
- `POST /api/v1/revenue-execution/actions/{action_id}/reopen`
- `GET /api/v1/revenue-execution/speed-to-lead-queue`
- `GET /api/v1/revenue-execution/activity-scorecard`

### Remaining APIs

#### Deferred UI

- `GET /api/v1/revenue-execution/monthly-summary` is not implemented in the Daily Execution page.
- `GET /api/v1/revenue-execution/action-templates` is not implemented in the Daily Execution page.
- `POST /api/v1/revenue-execution/action-templates` is not implemented in the Daily Execution page.
- `PATCH /api/v1/revenue-execution/action-templates/{template_id}` is not implemented in the Daily Execution page.
- `DELETE /api/v1/revenue-execution/action-templates/{template_id}` is not implemented in the Daily Execution page.

#### Backend Gap

- No confirmed huddle/rhythm endpoint exists for the static huddle agenda.

### API Notes

- `GET /api/v1/revenue-execution/days/today` and dated day detail calls are conditional. The page loads summary first and skips day detail when summary data does not indicate an existing day/actions, avoiding the normal missing-day 404 probe.
- `PATCH /api/v1/revenue-execution/actions/{action_id}` is implemented for title, description, severity, due date, and sort order. `owner_id` is not exposed because this page does not have a backend user selector.

## 13-Week Turnaround

File: `src/components/screens/TurnaroundPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/turnaround/plans?status=active`
- `GET /api/v1/revenue-execution/turnaround/plans/{plan_id}`
- `POST /api/v1/revenue-execution/turnaround/actions/{action_id}/complete`
- `POST /api/v1/revenue-execution/turnaround/actions/{action_id}/reopen`

### Remaining APIs

#### Deferred UI

- `POST /api/v1/revenue-execution/turnaround/plans` is not implemented because the existing page does not expose plan creation.
- `PATCH /api/v1/revenue-execution/turnaround/plans/{plan_id}` is not implemented because the existing page does not expose plan editing.
- `POST /api/v1/revenue-execution/turnaround/plans/{plan_id}/activate` is not implemented because the existing page does not expose plan list/switching.
- `POST /api/v1/revenue-execution/turnaround/plans/{plan_id}/close` is not implemented because the existing page does not expose plan closure.
- `PATCH /api/v1/revenue-execution/turnaround/actions/{action_id}` is wrapped but not exposed because the existing page only has action completion checkboxes.
- `GET /api/v1/revenue-execution/turnaround/plans/{plan_id}/export` is wrapped but not wired because the existing visible export links are evidence source links, not plan export controls.

#### Redundant/Superseded

- `GET /api/v1/revenue-execution/turnaround/plans/active` is wrapped but intentionally not used because a missing active plan returns a normal 404; the page now uses the 200 list endpoint with `status=active`.

## Lead Control Tower

File: `src/components/screens/revenue/LeadControlPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/lead-control`
- `POST /api/v1/revenue-execution/lead-control/auto-assign`
- `POST /api/v1/revenue-execution/lead-control/repair-next-actions`
- `POST /api/v1/leads/{lead_id}/activities` for the existing Contact action
- `PATCH /api/v1/leads/{lead_id}/status` after Contact succeeds for new leads

### API Notes

- `GET /api/v1/revenue-execution/lead-control` now consumes `kpi_cards`, `rows`, `scoring_model`, `qualification_checklist`, and row-level `actions` directly from the backend response.

### Remaining APIs

- No additional Lead Control Tower endpoints are currently exposed in OpenAPI.

#### Backend Gap

- `GET /api/v1/revenue-execution/lead-control` has no declared response schema in OpenAPI, so the UI uses defensive field mapping.

## Funnel Leak Audit

File: `src/components/screens/revenue/FunnelAuditPage.tsx`

### Implemented APIs

- `GET /api/v1/funnel/summary`
- `GET /api/v1/funnel/conversion-breakdown`
- `GET /api/v1/funnel/drop-off-alerts`
- `GET /api/v1/funnel/leads/activity-log`
- `GET /api/v1/revenue-execution/funnel-audit`

### Remaining APIs

#### Backend Gap

- No confirmed backend write endpoint exists for completing or reopening funnel corrective actions, so the old local-only Done/Reopen behavior was removed.
- `GET /api/v1/revenue-execution/funnel-audit` has no declared response schema in OpenAPI, so division breakdown and corrective action rows use defensive field mapping.

## Forecast & Coverage

File: `src/components/screens/ForecastPage.tsx`

### Implemented APIs

- `GET /api/v1/revenue-execution/forecast`
- `GET /api/v1/revenue-execution/forecast/export`
- `GET /api/v1/pipeline/reports`
- `GET /api/v1/leads/summary`

### API Notes

- `GET /api/v1/revenue-execution/forecast` now consumes `hero`, `kpi_cards`, `quality_controls`, `division_rows`, `scenario_options`, and `methodology` directly from the backend response.

### Remaining APIs

#### Backend Gap

- `GET /api/v1/revenue-execution/forecast/export` has no declared response schema in OpenAPI, so export success handling remains defensive.
- No confirmed backend write endpoint exists for editing forecast quality controls from this page.

## Compliance

File: `src/components/screens/CompliancePage.tsx`

### Implemented APIs

- `GET /api/v1/compliance/compliance-records`
- `PUT /api/v1/compliance/compliance-records/{record_id}`

### Remaining APIs

#### Deferred UI

- `POST /api/v1/compliance/compliance-records` is wrapped but not implemented because the existing page did not expose the full create-record form required by the backend schema.
- `GET /api/v1/compliance/compliance-records/{record_id}` is not implemented because the existing page does not expose a compliance record detail view.
- `DELETE /api/v1/compliance/compliance-records/{record_id}` is wrapped but not implemented because the existing page does not expose record deletion.

## Role & Permissions

File: `src/components/screens/RoleGovernancePage.tsx`

### Implemented APIs

- `GET /api/v1/roles/permissions-map`
- `GET /api/v1/roles/me/authority-limits`

### API Notes

- The role card uses the authenticated role and employee metadata already loaded by auth context.
- The page now uses an overview + tabs dashboard layout for Permissions, Authority Limits, Role Framework, and Backend Notes.
- The permissions matrix is read-only, searchable, action-filterable, and maps backend valid resources/actions against the authenticated role permissions.
- Authority limits render empty states when the backend returns no records.
- Role framework components are grouped as structure only; missing backend records are not filled with demo content.
- Role description fields show a backend-unavailable message without calling `/api/v1/roles/me/description`, because the current backend returns `404 No RoleDescription matches the given query`.
- The old hardcoded role templates, approval limits, and editable permission checkboxes were removed.

### Remaining APIs

#### Deferred UI

- Role-management write endpoints under `/api/v1/roles/{role_id}/...` are not implemented because this page does not expose a confirmed role selector or create/edit forms for role KPIs, SOPs, career paths, reporting lines, resources, success playbooks, task templates, or training requirements.
- No confirmed endpoint is currently wired for editing the authenticated role's permission grants from this screen.

#### Backend Gap

- `GET /api/v1/roles/me/description` is intentionally not called on this page until the backend provisions role-description records or changes missing records from 404 to an empty response.

## Approval Center

File: `src/components/screens/ApprovalsPage.tsx`

### Implemented APIs

- `GET /api/v1/approvals/requests`
- `POST /api/v1/approvals/requests/{request_id}/approve`
- `POST /api/v1/approvals/requests/{request_id}/reject`

### API Notes

- Approval cards now come from backend request rows only.
- Approve and Reject call the backend and refresh the list only after success.
- Approval decision payloads now send the OpenAPI-backed `comment` field.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/approvals/flows/choices`, `GET /api/v1/approvals/flows`, `POST /api/v1/approvals/flows`, `GET /api/v1/approvals/flows/{flow_id}`, `PUT /api/v1/approvals/flows/{flow_id}`, and `DELETE /api/v1/approvals/flows/{flow_id}` are wrapped or confirmed but not exposed because the current page is a request review queue, not an approval-flow administration screen.
- `POST /api/v1/approvals/requests` is wrapped but not exposed because the current page has no request creation form.
- `GET /api/v1/approvals/requests/{request_id}` and `DELETE /api/v1/approvals/requests/{request_id}` are wrapped but not exposed because there is no detail drawer or cancel-my-request control in the current page.

## Audit Log

File: `src/components/screens/AuditLogPage.tsx`

### Implemented APIs

- `GET /api/v1/audit-logs/`

### API Notes

- Audit rows now come from backend audit log entries.
- Search and audit type filters are passed as query params.
- Export audit is disabled because OpenAPI does not expose an audit export endpoint.

### Remaining APIs

#### Backend Gap

- No OpenAPI-confirmed audit export endpoint exists for the current Export audit control.

## Marketing Meetings

File: `src/components/screens/MarketingMeetingsPage.tsx`

### Implemented APIs

- `GET /api/v1/marketing/meetings`
- `POST /api/v1/marketing/meetings`
- `PATCH /api/v1/marketing/meetings/{meeting_id}`
- `POST /api/v1/marketing/meetings/{meeting_id}/actions`
- `PATCH /api/v1/marketing/meetings/actions/{action_id}`
- `POST /api/v1/marketing/meetings/{meeting_id}/decisions`
- `GET /api/v1/marketing/meetings/export`

### API Notes

- Meeting cards and metrics now come from backend meeting rows.
- Schedule meeting, edit meeting, record minutes, cancellation, action creation, action completion, decision recording, and export use marketing-specific endpoints.
- Cancellation uses `PATCH /api/v1/marketing/meetings/{meeting_id}` with `status: cancelled` because no marketing-specific delete endpoint is exposed.
- Status, location-type, priority, and meeting-type options are local schema choices; OpenAPI does not expose a marketing-meeting choices endpoint.
- Meeting list/export response schemas are weak, so the transformer and export handler use defensive URL/list fallbacks.

### Remaining APIs

#### Deferred UI

- `GET /api/v1/marketing/meetings/{meeting_id}` is wrapped but not exposed because the current page does not have a separate detail drawer.

## Verification Log

- `bun run tsc -b --noEmit` and `bun run lint` passed after bug-closure cleanup for Lead Detail, demo/offline removal, Design board, Support escalation, Revenue Command task empty state, and lint/type fixes.
- `bun run tsc -b --noEmit` and `bun run lint` passed after remaining API closure changes for Lead 360 activity edit, Content Calendar edit/publish, Media Library asset edit, Team Directory employee detail, and tracker categorization.
- `bun run tsc -b --noEmit` passed after unfinished API closure changes for Workdesk, Lead 360, Marketing Meetings, and backend contract gap documentation.
- `bun run tsc -b --noEmit` passed after removing synthetic meeting action/decision IDs from backend mutation paths.
- `bun run tsc -b --noEmit` passed after Role & Permissions overview/tabs redesign.
- `bun run tsc -b --noEmit` passed after suppressing expected missing-data requests for Playbooks and avoiding internal Partner Portal session 401 calls.
- `bun run tsc -b --noEmit` passed after removing blind Daily Execution day probes and switching Turnaround active plan loading to list/detail endpoints.
- `bun run tsc -b --noEmit` passed after Revenue Command changes.
- Focused lint passed for `RevenueCommandPage.tsx`, `KCard.tsx`, `marketingService.ts`, and `defaults.ts`.
- `bun run tsc -b --noEmit` passed after Daily Execution changes.
- Focused lint passed for `DailyExecutionPage.tsx` and `marketingService.ts`.
- `bun run tsc -b --noEmit` passed after Daily Execution date/action-edit changes.
- Focused lint passed for `DailyExecutionPage.tsx` and `marketingService.ts` after date/action-edit changes.
- `bun run tsc -b --noEmit` passed after handling missing dated Daily Execution days as empty state.
- Focused lint passed for `DailyExecutionPage.tsx` after handling missing dated Daily Execution days as empty state.
- `bun run tsc -b --noEmit` passed after suppressing missing DailyExecutionDay errors in Revenue Command.
- Focused lint passed for `RevenueCommandPage.tsx` after suppressing missing DailyExecutionDay errors.
- `bun run tsc -b --noEmit` passed after 13-week turnaround active-plan integration.
- Focused lint passed for `TurnaroundPage.tsx` and `marketingService.ts` after 13-week turnaround active-plan integration.
- `bun run tsc -b --noEmit` passed after Lead Control Tower integration.
- Focused lint passed for `LeadControlPage.tsx` and `marketingService.ts` after Lead Control Tower integration.
- `bun run tsc -b --noEmit` passed after Command Centre API integration.
- Focused lint passed for `DashboardPage.tsx` and `marketingService.ts` after Command Centre API integration.
- `bun run tsc -b --noEmit` passed after OKRs & Targets API integration.
- Focused lint passed for `OkrsPage.tsx` and `marketingService.ts` after OKRs & Targets API integration.
- `bun run tsc -b --noEmit` passed after Reports API integration.
- Focused lint passed for `ReportsPage.tsx`, `DashboardPage.tsx`, `OkrsPage.tsx`, `marketingService.ts`, and `workdeskService.ts` after Reports API integration.
- `bun run tsc -b --noEmit` passed after Revenue Controls API integration.
- Focused lint passed for `FunnelAuditPage.tsx`, `ForecastPage.tsx`, `CompliancePage.tsx`, and `marketingService.ts` after Revenue Controls API integration.
- `bun run tsc -b --noEmit` passed after fully mapping Lead Control Tower response fields.
- Focused lint passed for `LeadControlPage.tsx` and `marketingService.ts` after fully mapping Lead Control Tower response fields.
- `bun run tsc -b --noEmit` passed after fully mapping Forecast response fields.
- Focused lint passed for `ForecastPage.tsx` and `marketingService.ts` after fully mapping Forecast response fields.
- `bun run tsc -b --noEmit` passed after Commercial Operations API integration.
- Focused lint passed for `EmailCenterPage.tsx`, `MediaRegisterPage.tsx`, `HandoffPage.tsx`, `RealtorPortalPage.tsx`, `PartnerPortalPage.tsx`, `marketingService.ts`, and `marketingTransformers.ts` after Commercial Operations API integration.
- `bun run tsc -b --noEmit` passed after Governance and Campaign Operations API integration.

## Next

- Next page/module to choose.
