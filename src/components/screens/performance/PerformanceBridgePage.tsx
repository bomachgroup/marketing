import { useEffect, useState } from "react";
import {
  getMyTargets,
  getRoleKpis,
  getRoleTargetTemplates,
  listRoles,
} from "../../../services/api/performanceApi";
import type {
  PerformanceKpi,
  PerformanceRole,
  PerformanceTarget,
  PerformanceTargetProgress,
} from "../../../services/api/performanceTypes";
import { parseApiError } from "../../../services/api/apiClient";
import { workdeskService } from "../../../services/api/workdeskService";
import { marketingService } from "../../../services/api/marketingService";

type PerformanceBridgePageProps = {
  canManage: boolean;
};

type RevenueObjective = {
  id: string | number;
  title: string;
  status?: string;
  key_results: Array<{ id: string | number; title: string; target_value?: number | string }>;
};

function extractRevenueTargetCount(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  for (const key of ["total_targets", "target_count", "total", "count"]) {
    const count = Number(value[key]);
    if (Number.isFinite(count)) return count;
  }
  return null;
}

function extractRevenueObjectives(data: unknown): RevenueObjective[] {
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const rows = Array.isArray(data)
    ? data
    : ["items", "results", "data", "objectives"].flatMap((key) => Array.isArray(payload[key]) ? payload[key] : []);

  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const id = value.id;
    const title = typeof value.title === "string" ? value.title : null;
    if ((typeof id !== "string" && typeof id !== "number") || !title) return [];
    const keyResults = Array.isArray(value.key_results) ? value.key_results.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const keyResult = item as Record<string, unknown>;
      if ((typeof keyResult.id !== "string" && typeof keyResult.id !== "number") || typeof keyResult.title !== "string") return [];
      return [{ id: keyResult.id, title: keyResult.title, target_value: typeof keyResult.target_value === "number" || typeof keyResult.target_value === "string" ? keyResult.target_value : undefined }];
    }) : [];
    return [{ id, title, key_results: keyResults, ...(typeof value.status === "string" ? { status: value.status } : {}) }];
  });
}

function formatProgress(target: PerformanceTargetProgress): string {
  return target.achievementPercent === undefined
    ? "Progress unavailable"
    : `${target.achievementPercent}% achieved`;
}

export function PerformanceBridgePage({ canManage }: PerformanceBridgePageProps) {
  const [roles, setRoles] = useState<PerformanceRole[]>([]);
  const [myTargets, setMyTargets] = useState<PerformanceTargetProgress[]>([]);
  const [roleKpis, setRoleKpis] = useState<PerformanceKpi[]>([]);
  const [roleTargets, setRoleTargets] = useState<PerformanceTarget[]>([]);
  const [revenueObjectives, setRevenueObjectives] = useState<RevenueObjective[]>([]);
  const [revenueOkrError, setRevenueOkrError] = useState<string | null>(null);
  const [targetSummaryCount, setRevenueTargetCount] = useState<number | null>(null);
  const [revenueTargetError, setRevenueTargetError] = useState<string | null>(null);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [objectiveStart, setObjectiveStart] = useState("");
  const [objectiveEnd, setObjectiveEnd] = useState("");
  const [objectiveMutationError, setObjectiveMutationError] = useState<string | null>(null);
  const [isCreatingObjective, setIsCreatingObjective] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, string>>({});
  const [evidenceState, setEvidenceState] = useState<Record<string, { status: "idle" | "submitting" | "success" | "error"; message?: string }>>({});

  useEffect(() => {
    let active = true;
    void Promise.all([
      listRoles(),
      getMyTargets(),
      marketingService.getRevenueOkrs(),
      marketingService.getRevenueTargetsSummary(),
    ])
      .then(([nextRoles, nextTargets, okrResult, targetSummaryResult]) => {
        if (!active) return;
        setRoles(nextRoles);
        setMyTargets(nextTargets);
        setSelectedRoleId((current) => current ?? nextRoles[0]?.id ?? null);
        if (okrResult.status >= 200 && okrResult.status < 300) {
          setRevenueObjectives(extractRevenueObjectives(okrResult.data));
          setRevenueOkrError(null);
        } else if (okrResult.status === 404) {
          setRevenueOkrError("Revenue Execution OKRs are unavailable from the current backend.");
        } else {
          setRevenueOkrError("Could not load Revenue Execution OKRs. Retry to try again.");
        }
        if (targetSummaryResult.status >= 200 && targetSummaryResult.status < 300) {
          setRevenueTargetCount(extractRevenueTargetCount(targetSummaryResult.data));
          setRevenueTargetError(null);
        } else if (targetSummaryResult.status === 404) {
          setRevenueTargetError("Revenue Execution target summaries are unavailable from the current backend.");
        } else {
          setRevenueTargetError("Could not load Revenue Execution target summary.");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load performance data.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedRoleId === null) {
      return;
    }
    let active = true;
    void Promise.all([getRoleKpis(selectedRoleId), getRoleTargetTemplates(selectedRoleId)])
      .then(([nextKpis, nextTargets]) => {
        if (!active) return;
        setRoleKpis(nextKpis);
        setRoleTargets(nextTargets);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load the role performance definition.");
      })
      .finally(() => {
        if (active) setIsRoleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedRoleId]);

  const handleRoleChange = (roleId: string) => {
    setError(null);
    setIsRoleLoading(true);
    setSelectedRoleId(roleId);
  };

  const handleCreateObjective = async () => {
    if (!objectiveTitle.trim() || !objectiveStart || !objectiveEnd) {
      setObjectiveMutationError("Title, start date, and end date are required.");
      return;
    }

    setIsCreatingObjective(true);
    setObjectiveMutationError(null);
    try {
      const result = await marketingService.createRevenueObjective({
        title: objectiveTitle.trim(),
        period_start: objectiveStart,
        period_end: objectiveEnd,
      });

      if (result.error || result.status < 200 || result.status >= 300) {
        setObjectiveMutationError(parseApiError(result.error || `Objective creation failed (${result.status}).`));
        return;
      }

      const refreshed = await marketingService.getRevenueOkrs();
      if (refreshed.status >= 200 && refreshed.status < 300) {
        setRevenueObjectives(extractRevenueObjectives(refreshed.data));
        setShowObjectiveForm(false);
        setObjectiveTitle("");
        setObjectiveStart("");
        setObjectiveEnd("");
      } else {
        setObjectiveMutationError("Objective was created, but the refreshed list could not be loaded.");
      }
    } catch (reason: unknown) {
      setObjectiveMutationError(parseApiError(reason));
    } finally {
      setIsCreatingObjective(false);
    }
  };

  const handleEvidenceSubmit = async (target: PerformanceTargetProgress) => {
    const targetKey = String(target.id);
    const summary = evidenceDrafts[targetKey]?.trim() || "";
    if (!summary) {
      setEvidenceState((current) => ({
        ...current,
        [targetKey]: { status: "error", message: "Evidence summary is required." },
      }));
      return;
    }

    const targetId = Number(target.id);
    if (!Number.isInteger(targetId)) {
      setEvidenceState((current) => ({
        ...current,
        [targetKey]: { status: "error", message: "This target cannot accept evidence until it has a valid backend ID." },
      }));
      return;
    }

    const progressValue = target.actualValue ?? target.achievementPercent ?? 0;
    setEvidenceState((current) => ({
      ...current,
      [targetKey]: { status: "submitting" },
    }));

    const result = await workdeskService.createTargetReport({
      employee_target_id: targetId,
      summary,
      progress_value: progressValue,
    });

    if (result.error || result.status < 200 || result.status >= 300) {
      setEvidenceState((current) => ({
        ...current,
        [targetKey]: { status: "error", message: parseApiError(result.error || `Evidence submission failed (${result.status}).`) },
      }));
      return;
    }

    setEvidenceDrafts((current) => ({ ...current, [targetKey]: "" }));
    setEvidenceState((current) => ({
      ...current,
      [targetKey]: { status: "success", message: `Evidence submitted for ${target.name}.` },
    }));
  };

  return (
    <main className="flex min-h-0 flex-col gap-5 overflow-y-auto p-4 sm:p-6 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-3">HR Performance Bridge</p>
          <h1 className="mt-1 text-2xl font-extrabold text-text">Targets &amp; progress</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-2">Role definitions come from HR. Progress is shown only when the backend returns employee target evidence.</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text" aria-label="Manage role targets">
              Manage role targets
            </button>
            <button type="button" onClick={() => { setObjectiveMutationError(null); setShowObjectiveForm(true); }} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white" aria-label="Create Revenue objective">
              Create Revenue objective
            </button>
          </div>
        ) : null}
      </header>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm" aria-label="Revenue Execution OKRs">
        <h2 className="text-base font-bold text-text">Revenue Execution OKRs</h2>
        <p className="mt-1 text-xs text-text-3">Revenue objectives and key results returned by the backend.</p>
        {showObjectiveForm ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-border bg-surface-1 p-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-text-2 sm:col-span-3">
              Objective title
              <input aria-label="Objective title" value={objectiveTitle} onChange={(event) => setObjectiveTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" />
            </label>
            <label className="text-xs font-semibold text-text-2">
              Start date
              <input aria-label="Objective start" type="date" value={objectiveStart} onChange={(event) => setObjectiveStart(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" />
            </label>
            <label className="text-xs font-semibold text-text-2">
              End date
              <input aria-label="Objective end" type="date" value={objectiveEnd} onChange={(event) => setObjectiveEnd(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" />
            </label>
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setShowObjectiveForm(false)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-2">Cancel</button>
              <button type="button" disabled={isCreatingObjective} onClick={() => void handleCreateObjective()} className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{isCreatingObjective ? "Saving…" : "Save objective"}</button>
            </div>
            {objectiveMutationError ? <p className="text-xs font-semibold text-red-700 sm:col-span-3" role="alert">{objectiveMutationError}</p> : null}
          </div>
        ) : null}
        {revenueOkrError ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">{revenueOkrError}</p> : null}
        {!revenueOkrError && !revenueObjectives.length && !isLoading ? <p className="mt-3 text-xs text-text-2">No Revenue Execution OKRs were returned.</p> : null}
        {revenueObjectives.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {revenueObjectives.map((objective) => (
              <article key={objective.id} className="rounded-lg border border-border bg-surface-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-text">{objective.title}</h3>
                  {objective.status ? <span className="text-[11px] font-semibold text-text-3">{objective.status}</span> : null}
                </div>
                {objective.key_results.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-text-2">
                    {objective.key_results.map((keyResult) => <li key={keyResult.id}>{keyResult.title}{keyResult.target_value !== undefined ? ` · target ${keyResult.target_value}` : ""}</li>)}
                  </ul>
                ) : <p className="mt-3 text-xs text-text-3">No key results returned.</p>}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm" aria-label="Revenue Execution target summary">
        <h2 className="text-base font-bold text-text">Revenue Execution target summary</h2>
        {revenueTargetError ? (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">{revenueTargetError}</p>
        ) : targetSummaryCount === null ? (
          <p className="mt-3 text-xs text-text-2">No target summary was returned.</p>
        ) : (
          <p className="mt-3 text-xs text-text-2">{targetSummaryCount} targets in the current summary</p>
        )}
      </section>

      {error ? (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-2">Loading performance data…</p>
      ) : (
        <>
          {!roles.length && !error ? <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-2">No roles returned from the backend.</p> : null}

          {roles.length ? (
            <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-text">Role definition</h2>
                  <p className="text-xs text-text-3">KPI and target definitions are read from the selected HR role.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-text-2">
                  Role
                  <select
                    value={selectedRoleId === null ? "" : String(selectedRoleId)}
                    onChange={(event) => handleRoleChange(event.target.value)}
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text"
                    aria-label="Performance role"
                  >
                    {roles.map((role) => <option key={role.id} value={String(role.id)}>{role.name}</option>)}
                  </select>
                </label>
              </div>
              {isRoleLoading ? <p className="mt-4 text-xs text-text-2">Loading role definition…</p> : null}
              {!isRoleLoading && roleKpis.length ? (
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Role KPI definitions">
                  {roleKpis.map((kpi) => <span key={kpi.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-navy">{kpi.name}</span>)}
                </div>
              ) : null}
              {!isRoleLoading && !roleKpis.length && !error ? <p className="mt-4 text-xs text-text-2">No KPI definitions returned for this role.</p> : null}
              {roleTargets.length ? <p className="mt-3 text-xs text-text-2">{roleTargets.length} role target definition{roleTargets.length === 1 ? "" : "s"} returned by HR.</p> : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm" aria-label="Employee target progress">
            <h2 className="text-base font-bold text-text">My target progress</h2>
            {myTargets.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myTargets.map((target) => (
                  <article key={target.id} className="rounded-xl border border-border bg-surface-1 p-4">
                    <h3 className="text-sm font-bold text-text">{target.name}</h3>
                    <p className="mt-2 text-lg font-extrabold text-navy">{formatProgress(target)}</p>
                    <div className="mt-2 space-y-1 text-xs text-text-3">
                      {target.period ? <p>Period: {target.period}</p> : null}
                      {target.periodStart || target.periodEnd ? <p>Window: {target.periodStart || "—"} to {target.periodEnd || "—"}</p> : null}
                      {target.actualValue !== undefined && target.targetValue !== undefined ? <p>Actual: {target.actualValue} / {target.targetValue}{target.unit ? ` ${target.unit}` : ""}</p> : null}
                      {target.evidenceRef ? <p>Evidence: {target.evidenceRef}</p> : null}
                      {target.evidenceAvailable === false ? <p>Evidence unavailable</p> : null}
                    </div>
                    <div className="mt-4 border-t border-border/70 pt-3">
                      <label className="text-[11px] font-bold text-text-2" htmlFor={`evidence-${target.id}`}>
                        Marketing evidence
                      </label>
                      <textarea
                        id={`evidence-${target.id}`}
                        aria-label={`Evidence summary for ${target.name}`}
                        value={evidenceDrafts[String(target.id)] || ""}
                        onChange={(event) => setEvidenceDrafts((current) => ({ ...current, [String(target.id)]: event.target.value }))}
                        placeholder="Describe the campaign, lead, revenue or delivery evidence..."
                        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-border bg-surface p-2 text-xs text-text outline-none placeholder:text-text-3 focus:border-navy focus:ring-1 focus:ring-navy/20"
                        disabled={evidenceState[String(target.id)]?.status === "submitting"}
                      />
                      <button
                        type="button"
                        onClick={() => void handleEvidenceSubmit(target)}
                        disabled={evidenceState[String(target.id)]?.status === "submitting"}
                        className="mt-2 rounded-lg bg-navy px-3 py-1.5 text-[11px] font-bold text-white disabled:cursor-wait disabled:opacity-50"
                        aria-label={`Submit evidence for ${target.name}`}
                      >
                        {evidenceState[String(target.id)]?.status === "submitting" ? "Submitting…" : "Submit evidence"}
                      </button>
                      {evidenceState[String(target.id)]?.message ? (
                        <p className={`mt-2 text-[11px] font-semibold ${evidenceState[String(target.id)]?.status === "error" ? "text-red-700" : "text-emerald-700"}`} role={evidenceState[String(target.id)]?.status === "error" ? "alert" : undefined}>
                          {evidenceState[String(target.id)]?.message}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-2">No target pack returned. No employee targets are currently assigned by the backend.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
