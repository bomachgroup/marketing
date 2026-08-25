import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ROLES } from "../../data/defaults";
import {
  workdeskService,
  type DashboardSummaryResponse,
  type PerformanceCardResponse,
  type DailyRoutineItem,
  type EmployeeKPIItem,
  type EmployeeTargetItem,
  type TargetReportItem,
} from "../../services/api/workdeskService";
import { parseApiError } from "../../services/api/apiClient";
import { Topbar } from "../shared";
import { AppIcon } from "../shared/AppIcon";
import { BusyLabel, EmptyState } from "../shared/StatePanel";
import { SkeletonCardGrid, SkeletonList } from "../shared/Skeletons";
import NoPermissionPage from "../layout/NoPermissionPage";

const UNIT_COLORS = ["#1F3D7A", "#7C3AED", "#B87D00", "#0A6B3E", "#CC0000"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const groupIcons = [
  {
    icon: <AppIcon name="sun" size={16} />,
    color: "#B87D00",
    tint: "#FFF8E7",
    label: "Morning routine",
  },
  {
    icon: <AppIcon name="sun-high" size={16} />,
    color: "#1F3D7A",
    tint: "#EEF2FF",
    label: "Afternoon routine",
  },
  {
    icon: <AppIcon name="moon" size={16} />,
    color: "#7C3AED",
    tint: "#F6EFFF",
    label: "Before close of day",
  },
];

function boundedPercent(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function averagePercent(
  rows: Array<{ score_percentage?: unknown; progress_percentage?: unknown }>,
  fallback: number,
) {
  if (!rows.length) return fallback;
  const values = rows.map((row) =>
    boundedPercent(row.score_percentage ?? row.progress_percentage),
  );
  return values.length
    ? boundedPercent(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      )
    : fallback;
}

interface WorkdeskSopRow {
  title?: string;
  name?: string;
  description?: string;
}

interface WorkdeskUnitRow {
  id?: string | number;
  name?: string;
  unit_name?: string;
  description?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractItems<T>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!isRecord(value)) return [];

  for (const key of keys) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested as T[];
  }

  return [];
}

export function WorkdeskPage() {
  const { activeRole, opsState, setOpsState } = useStore();
  const { user, userRole, employeeDetails } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [summaryData, setSummaryData] =
    useState<DashboardSummaryResponse | null>(null);
  const [perfCard, setPerfCard] = useState<PerformanceCardResponse | null>(
    null,
  );
  const [apiRoutines, setApiRoutines] = useState<DailyRoutineItem[]>([]);
  const [apiObligations, setApiObligations] = useState<string[]>([]);
  const [apiUnits, setApiUnits] = useState<Array<[string, string, string]>>([]);
  const [apiKpis, setApiKpis] = useState<EmployeeKPIItem[]>([]);
  const [apiTargets, setApiTargets] = useState<EmployeeTargetItem[]>([]);
  const [targetReports, setTargetReports] = useState<TargetReportItem[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isLoadingWorkdesk, setIsLoadingWorkdesk] = useState(true);
  const [apiError, setApiError] = useState("");

  const roleLabel =
    summaryData?.full_name && summaryData.full_name.trim()
      ? summaryData.full_name.trim()
      : user
        ? (user.first_name || "").trim() || (user.last_name || "").trim()
          ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
          : user.username && user.username.trim()
            ? user.username.trim()
            : user.email
              ? user.email.split("@")[0]
              : ROLES[activeRole as keyof typeof ROLES]?.n || "User"
        : ROLES[activeRole as keyof typeof ROLES]?.n || "User";

  const roleTitle =
    summaryData?.job_title ||
    userRole?.name ||
    employeeDetails?.role_name ||
    employeeDetails?.position ||
    employeeDetails?.designation ||
    user?.role ||
    "Team Member";

  // Fetch real Work Desk data strictly from backend endpoints
  const loadWorkdeskData = useCallback(async () => {
      setIsLoadingWorkdesk(true);
      try {
        const [
          sumRes,
          perfRes,
          routinesRes,
          sopsRes,
          unitsRes,
          kpisRes,
          targetsRes,
          reportsRes,
        ] = await Promise.all([
          workdeskService.getSummary().catch(() => null),
          workdeskService.getPerformanceCard().catch(() => null),
          workdeskService.getDailyRoutines().catch(() => null),
          workdeskService.getRoleSOPs().catch(() => null),
          workdeskService.getDepartmentUnits().catch(() => null),
          workdeskService.getMyKPIs().catch(() => null),
          workdeskService.getMyTargets().catch(() => null),
          workdeskService.getMyTargetReports({ limit: 20 }).catch(() => null),
        ]);

        if (sumRes?.data) setSummaryData(sumRes.data);
        else if (sumRes?.error) setApiError(parseApiError(sumRes.error));
        if (perfRes?.data) setPerfCard(perfRes.data);
        if (routinesRes?.data) {
          setApiRoutines(
            extractItems<DailyRoutineItem>(routinesRes.data, [
              "items",
              "results",
              "routines",
              "rows",
              "data",
            ]),
          );
        }

        // Map SOPs to role obligations. Role descriptions can 404 when no backend record exists.
        if (sopsRes?.data?.items?.length) {
          const list = (sopsRes.data.items as WorkdeskSopRow[])
            .map((sop) => sop.title || sop.name || sop.description)
            .filter((item): item is string => Boolean(item));
          if (list.length) setApiObligations(list);
        }

        // Map department units
        if (Array.isArray(unitsRes?.data) && unitsRes.data.length) {
          const mapped = (unitsRes.data as WorkdeskUnitRow[]).map(
            (u, idx) =>
              [
                `UNIT ${idx + 1}`,
                u.name || u.unit_name || `Unit ${idx + 1}`,
                u.description || "Departmental execution & tracking unit",
              ] as [string, string, string],
          );
          setApiUnits(mapped);
        }

        if (kpisRes?.data) {
          setApiKpis(
            extractItems<EmployeeKPIItem>(kpisRes.data, [
              "items",
              "results",
              "kpis",
              "rows",
              "data",
            ]),
          );
        }
        if (targetsRes?.data) {
          setApiTargets(
            extractItems<EmployeeTargetItem>(targetsRes.data, [
              "items",
              "results",
              "targets",
              "rows",
              "data",
            ]),
          );
        }
        if (reportsRes?.data) {
          setTargetReports(
            extractItems<TargetReportItem>(reportsRes.data, [
              "items",
              "results",
              "reports",
              "rows",
              "data",
            ]),
          );
        }
      } catch {
        /* Strictly no dummy fallback */
      } finally {
        setIsLoadingWorkdesk(false);
      }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkdeskData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkdeskData]);

  const key = todayKey();
  const dayChecks = opsState?.dailyChecks?.[key]?.[activeRole] || {};
  const dailyReport = opsState?.dailyReports?.[key]?.[activeRole];

  const morningApi = apiRoutines
    .filter((r) => r.category === "morning")
    .map((r) => r.routine_name);
  const afternoonApi = apiRoutines
    .filter((r) => r.category === "afternoon")
    .map((r) => r.routine_name);
  const closeApi = apiRoutines
    .filter((r) => r.category === "close")
    .map((r) => r.routine_name);

  const groups: Array<[string, string[]]> = [
    ["Morning routine", morningApi],
    ["Afternoon routine", afternoonApi],
    ["Before close of day", closeApi],
  ];

  let total = 0;
  let done = 0;
  groups.forEach((g, gi) =>
    g[1].forEach((_, i) => {
      total++;
      if (dayChecks[gi + "-" + i]) done++;
    }),
  );

  const pct =
    perfCard?.overall_score ?? (total ? Math.round((done / total) * 100) : 0);
  const rank = perfCard?.rank_text || (pct > 0 ? "#1 of 5" : "N/A");
  const reportStatus = dailyReport ? "Submitted" : "Pending";
  const perfCrm = perfCard?.work_report?.completed_tasks
    ? Math.round(
        (perfCard.work_report.completed_tasks /
          (perfCard.work_report.total_tasks || 1)) *
          100,
      )
    : pct;
  const kpiScore = averagePercent(apiKpis, perfCrm);
  const perfTarget = averagePercent(
    apiTargets,
    perfCard?.punctuality_report?.punctuality_rate ?? pct,
  );
  const reportScore = targetReports.length || dailyReport ? 100 : 0;

  const [summary, setSummary] = useState("");
  const [period, setPeriod] = useState("week");

  const toggleRoutine = (id: string) => {
    const nextDay = { ...(opsState?.dailyChecks?.[key] || {}) };
    const roleChecks = { ...(nextDay[activeRole] || {}) };
    roleChecks[id] = !roleChecks[id];
    nextDay[activeRole] = roleChecks;
    setOpsState({
      ...opsState,
      dailyChecks: { ...(opsState?.dailyChecks || {}), [key]: nextDay },
    });
  };

  const submitDailySummary = async () => {
    if (!summary.trim()) {
      showToast("Please enter your close-of-day summary first", "error");
      return;
    }
    const reportTarget = apiTargets.find(
      (target) => target.id !== undefined && target.id !== null,
    );
    if (!reportTarget) {
      showToast(
        "No active backend target is assigned to your role yet.",
        "error",
      );
      return;
    }
    const targetId = Number(reportTarget.id);
    if (!Number.isFinite(targetId)) {
      showToast("The selected target row has an invalid backend ID.", "error");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const res = await workdeskService.createTargetReport({
        employee_target_id: targetId,
        summary,
        progress_value: perfTarget,
      });

      if (!res.data) {
        showToast(
          parseApiError(res.error || "Could not submit daily report"),
          "error",
        );
        return;
      }

      const reportsRes = await workdeskService.getMyTargetReports({
        limit: 20,
      });
      if (reportsRes.data) {
        setTargetReports(
          extractItems<TargetReportItem>(reportsRes.data, [
            "items",
            "results",
            "reports",
            "rows",
            "data",
          ]),
        );
      }
    } catch (err: unknown) {
      showToast(
        parseApiError(err instanceof Error ? err.message : err),
        "error",
      );
      return;
    } finally {
      setIsSubmittingReport(false);
    }

    const nextReports = { ...(opsState?.dailyReports?.[key] || {}) };
    nextReports[activeRole] = {
      text: summary,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setOpsState({
      ...opsState,
      dailyReports: { ...(opsState?.dailyReports || {}), [key]: nextReports },
    });
    showToast("Daily summary submitted successfully!", "success");
    setSummary("");
  };

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="workdesk" />
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="My work desk" period={period} onPeriodChange={setPeriod} />

      <div className="min-w-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto p-5">
        {/* ── Welcome Hero + Performance Card Banner ──────────────────── */}
        {isLoadingWorkdesk ? (
          <WorkdeskHeroSkeleton />
        ) : (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173069] via-[#1F3D7A] to-[#254BA0] p-6 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-48 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.5fr_0.85fr]">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    <span>BOMACH OS</span>
                    <span>•</span>
                    <span>ROLE INHERITANCE</span>
                    <span>•</span>
                    <span>DAILY EXECUTION</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Welcome back, {roleLabel}!
                  </h2>
                  <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-white/80">
                    Your dashboard is generated from your role template,
                    permissions, daily routine, targets, KPIs, approvals and
                    reporting obligations. Every completed activity contributes
                    to your performance history.
                  </p>
                </div>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur ring-1 ring-white/20">
                    Role: {roleTitle}
                  </span>
                </div>
              </div>

              {/* Today's Role Performance Sub-Card */}
              <div className="flex flex-col justify-between rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/70">
                    <span>TODAY'S ROLE PERFORMANCE</span>
                    <span className="rounded bg-white/20 px-2 py-0.5 font-bold text-white">
                      Rank {rank}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight">
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-white/70">Department ranking</span>
                    <span className="font-semibold text-white">{rank}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-white/70">Tasks completed</span>
                    <span className="font-semibold text-white">
                      {done} / {total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Close-of-day report</span>
                    <span
                      className={`font-semibold ${dailyReport ? "text-emerald-300" : "text-amber-300"}`}
                    >
                      {reportStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Marketing & Revenue Units Row ─────────────────────────── */}
        <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-base font-bold text-text">Department units</h2>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {apiUnits.length ? (
              apiUnits.map((u, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: UNIT_COLORS[i % UNIT_COLORS.length] }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-3">
                    {u[0]}
                  </span>
                  <h3 className="mt-1.5 text-xs font-bold leading-snug text-text">
                    {u[1]}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-2">
                    {u[2]}
                  </p>
                </div>
              ))
            ) : isLoadingWorkdesk ? (
              <div className="col-span-full">
                <SkeletonCardGrid cards={5} />
              </div>
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title="No department units"
                  description="No department units are configured."
                  icon="ti-building-community"
                  compact
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Main Two-Column Content Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          {/* LEFT: Daily Routines Checklist */}
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
              <h2 className="text-base font-bold text-text">Daily routines</h2>
              {isLoadingWorkdesk ? (
                <Skeleton width={120} height={12} />
              ) : (
                <span className="text-xs font-semibold text-text-3">
                  {done} of {total} completed ({pct}%)
                </span>
              )}
              </div>

            <div className="space-y-6 pt-1">
              {total > 0 ? (
                groups.map((g, gi) => {
                  const groupDone = g[1].filter(
                    (_, i) => dayChecks[gi + "-" + i],
                  ).length;
                  const meta = groupIcons[gi];
                  if (!g[1].length) return null;
                  return (
                    <div key={gi} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-md text-xs"
                            style={{ background: meta.tint, color: meta.color }}
                          >
                            {meta.icon}
                          </span>
                          <span className="text-xs font-bold text-text">
                            {g[0]}
                          </span>
                        </div>
                        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-bold text-text-2">
                          {groupDone}/{g[1].length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {g[1].map((item, i) => {
                          const id = gi + "-" + i;
                          const checked = !!dayChecks[id];
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleRoutine(id)}
                              className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.99] ${
                                checked
                                  ? "border-emerald-200 bg-emerald-50/60"
                                  : "border-border bg-surface hover:border-border-2 hover:bg-surface-1"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                  checked
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-border-2 bg-surface group-hover:border-navy"
                                }`}
                              >
                                {checked && (
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="h-3 w-3"
                                    fill="none"
                                  >
                                    <path
                                      d="M2 6.5L5 9.5L10 3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <div className="min-w-0">
                                <span
                                  className={`block text-xs font-semibold leading-snug ${
                                    checked
                                      ? "text-text-3 line-through"
                                      : "text-text"
                                  }`}
                                >
                                  {item}
                                </span>
                                <span className="mt-1 block text-[10px] text-text-3">
                                  Role-based routine · logged to performance
                                  history
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : isLoadingWorkdesk ? (
                <SkeletonList rows={6} />
              ) : (
                <EmptyState
                  title="No daily routines"
                  description="No daily routine tasks are assigned to this role."
                  icon="ti-list-check"
                  compact
                />
              )}
            </div>
          </div>

          {/* RIGHT: Performance Overview & Obligations Sidebar */}
          <div className="space-y-5">
            {/* Performance Gauge */}
            {isLoadingWorkdesk ? (
              <PerformanceOverviewSkeleton />
            ) : (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <h3 className="text-sm font-bold text-text">
                  Performance Overview
                </h3>
                <div className="mt-4 flex flex-col items-center">
                  <div
                    className="relative flex h-36 w-36 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#1F3D7A ${pct}%, #EEF0F4 0)`,
                    }}
                  >
                    <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-surface shadow-inner">
                      <span className="text-3xl font-extrabold text-text">
                        {pct}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">
                        Overall score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    [`${kpiScore}%`, "KPI score", kpiScore],
                    [`${perfTarget}%`, "Target progress", perfTarget],
                    [`${targetReports.length}`, "Reports", reportScore],
                    [
                      `${perfCard?.punctuality_report?.punctuality_rate ?? 0}%`,
                      "Punctuality",
                      perfCard?.punctuality_report?.punctuality_rate ?? 0,
                    ],
                  ].map(([val, label, barPct], i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-surface-1 p-3 border border-border/50"
                    >
                      <span className="block text-base font-extrabold text-text">
                        {val}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-text-3">
                        {label}
                      </span>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-navy transition-all duration-300"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-border/50 bg-surface-1 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase text-text-3">
                      KPI rows
                    </div>
                    {apiKpis.length ? (
                      apiKpis.slice(0, 3).map((kpi) => (
                        <div key={String(kpi.id)} className="mb-2 last:mb-0">
                          <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-semibold text-text">
                            <span className="truncate">{kpi.metric_name}</span>
                            <span>{boundedPercent(kpi.score_percentage)}%</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-navy"
                              style={{
                                width: `${boundedPercent(kpi.score_percentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : isLoadingWorkdesk ? (
                      <SkeletonList rows={3} />
                    ) : (
                      <EmptyState
                        title="No KPI rows"
                        description="No KPI rows were returned."
                        icon="ti-chart-bar"
                        compact
                      />
                    )}
                  </div>

                  <div className="min-w-0 rounded-lg border border-border/50 bg-surface-1 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase text-text-3">
                      Target rows
                    </div>
                    {apiTargets.length ? (
                      apiTargets.slice(0, 3).map((target) => (
                        <div key={String(target.id)} className="mb-2 last:mb-0">
                          <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-semibold text-text">
                            <span className="truncate">
                              {target.title || target.target_name || `Target #${target.id}`}
                            </span>
                            <span>
                              {boundedPercent(target.progress_percentage)}%
                            </span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{
                                width: `${boundedPercent(target.progress_percentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : isLoadingWorkdesk ? (
                      <SkeletonList rows={3} />
                    ) : (
                      <EmptyState
                        title="No target rows"
                        description="No target rows were returned."
                        icon="ti-target-arrow"
                        compact
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Role Obligations */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-text">
                  Role obligations
                </h3>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/role-governance" })}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View role →
                </button>
                </div>
              </div>
              {apiObligations.length ? (
                <ul className="mt-3 space-y-2.5">
                  {apiObligations.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-xs text-text-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-medium leading-snug">{o}</span>
                    </li>
                  ))}
                </ul>
              ) : isLoadingWorkdesk ? (
                <div className="mt-3">
                  <SkeletonList rows={4} />
                </div>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    title="No role obligations"
                    description="No role obligations are configured."
                    icon="ti-clipboard-list"
                    compact
                  />
                </div>
              )}
            </div>

            {/* Close of Day Summary */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text">
                Close-of-day summary
              </h3>
              <p className="mt-1 text-xs font-medium text-text-3">
                Wins, blockers and tomorrow's priorities
              </p>
              <textarea
                value={summary}
                disabled={isSubmittingReport}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Summarise outcomes, blockers, revenue movement and next actions..."
                className="mt-3 min-h-24 w-full resize-none rounded-xl border border-border bg-surface-1 p-3 text-xs text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-navy/30 disabled:cursor-wait disabled:opacity-60"
              />
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={submitDailySummary}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-xs font-bold text-white transition-all hover:bg-navy-dark active:scale-98 disabled:opacity-50"
              >
                {isSubmittingReport ? (
                  <BusyLabel>Submitting...</BusyLabel>
                ) : (
                  <>
                    <AppIcon name="send" size={14} /> Submit daily report
                  </>
                )}
              </button>
              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="text-[10px] font-bold uppercase text-text-3">
                  Recent target reports
                </div>
                {targetReports.length ? (
                  <div className="mt-2 space-y-2">
                    {targetReports.slice(0, 3).map((report) => (
                      <div
                        key={String(report.id)}
                        className="rounded-lg border border-border/50 bg-surface-1 p-2.5"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-bold text-text">
                          <span className="truncate">
                            {report.employee_target?.title || `Target report #${report.id}`}
                          </span>
                          <span className="shrink-0 text-text-3">
                            {report.status || "Submitted"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] font-medium text-text-3">
                          {report.summary || "No summary returned."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : isLoadingWorkdesk ? (
                  <div className="mt-2">
                    <SkeletonList rows={3} />
                  </div>
                ) : (
                  <div className="mt-2">
                    <EmptyState
                      title="No target reports"
                      description="No target reports were returned."
                      icon="ti-file-text"
                      compact
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkdeskHeroSkeleton() {
  return (
    <SkeletonTheme
      baseColor="rgba(255,255,255,0.16)"
      highlightColor="rgba(255,255,255,0.28)"
      borderRadius={10}
    >
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173069] via-[#1F3D7A] to-[#254BA0] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.5fr_0.85fr]">
          <div className="flex min-h-44 flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Skeleton width={72} height={10} />
                <Skeleton width={90} height={10} />
                <Skeleton width={104} height={10} />
              </div>
              <div className="mt-4">
                <Skeleton width="58%" height={34} />
              </div>
              <div className="mt-3 max-w-xl space-y-2">
                <Skeleton width="96%" height={11} />
                <Skeleton width="88%" height={11} />
                <Skeleton width="62%" height={11} />
              </div>
            </div>
            <div className="mt-6">
              <Skeleton width={190} height={28} />
            </div>
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Skeleton width={150} height={10} />
                <Skeleton width={72} height={20} />
              </div>
              <div className="mt-4">
                <Skeleton width={110} height={52} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton width="100%" height={12} />
              <Skeleton width="100%" height={12} />
              <Skeleton width="84%" height={12} />
            </div>
          </div>
        </div>
      </section>
    </SkeletonTheme>
  );
}

function PerformanceOverviewSkeleton() {
  return (
    <SkeletonTheme
      baseColor="#EEF0F4"
      highlightColor="#F8F9FB"
      borderRadius={10}
    >
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <Skeleton width={150} height={14} />
        <div className="mt-4 flex flex-col items-center">
          <Skeleton circle width={144} height={144} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-border/50 bg-surface-1 p-3"
            >
              <Skeleton width="48%" height={18} />
              <div className="mt-2">
                <Skeleton width="72%" height={10} />
              </div>
              <div className="mt-2">
                <Skeleton width="100%" height={4} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
          <SkeletonList rows={3} />
          <SkeletonList rows={3} />
        </div>
      </div>
    </SkeletonTheme>
  );
}
