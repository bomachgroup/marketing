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

type PerformanceBridgePageProps = {
  canManage: boolean;
};

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
  const [selectedRoleId, setSelectedRoleId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, string>>({});
  const [evidenceState, setEvidenceState] = useState<Record<string, { status: "idle" | "submitting" | "success" | "error"; message?: string }>>({});

  useEffect(() => {
    let active = true;
    void Promise.all([listRoles(), getMyTargets()])
      .then(([nextRoles, nextTargets]) => {
        if (!active) return;
        setRoles(nextRoles);
        setMyTargets(nextTargets);
        setSelectedRoleId((current) => current ?? nextRoles[0]?.id ?? null);
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
          <button type="button" className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white" aria-label="Manage role targets">
            Manage role targets
          </button>
        ) : null}
      </header>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="Unsupported OKR capability">
        <h2 className="text-sm font-bold text-amber-950">Company OKRs unavailable</h2>
        <p className="mt-1 text-xs text-amber-900">Objectives and OKRs are not available from the current backend. This view uses supported role targets and KPI definitions instead.</p>
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
