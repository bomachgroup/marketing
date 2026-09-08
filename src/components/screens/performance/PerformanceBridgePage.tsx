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

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
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
      setRoleKpis([]);
      setRoleTargets([]);
      return;
    }
    let active = true;
    setIsRoleLoading(true);
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
                    onChange={(event) => setSelectedRoleId(event.target.value)}
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
                    {target.evidenceAvailable === false ? <p className="mt-1 text-xs text-text-3">Evidence unavailable</p> : null}
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

