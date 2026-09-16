import { apiRequest } from "./apiClient";
import type {
  PerformanceKpi,
  PerformanceRole,
  PerformanceTarget,
  PerformanceTargetProgress,
} from "./performanceTypes";

export class PerformanceApiError extends Error {
  readonly status: number;
  readonly code: "http" | "malformed";

  constructor(
    message: string,
    status: number,
    code: "http" | "malformed",
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "PerformanceApiError";
  }
}

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined(record: RecordValue, keys: string[]): unknown {
  return keys.map((key) => record[key]).find((value) => value !== undefined && value !== null);
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function idValue(record: RecordValue): string | number | undefined {
  const value = firstDefined(record, ["id", "uuid", "pk"]);
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function listPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) throw malformed("Expected a list response.");

  for (const key of ["results", "items", "data", "roles", "kpis", "targets"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  throw malformed("Expected a list response envelope.");
}

function malformed(message: string): PerformanceApiError {
  return new PerformanceApiError(message, 200, "malformed");
}

function httpError(status: number, message: string | undefined): PerformanceApiError {
  return new PerformanceApiError(message || `Performance request failed (${status}).`, status, "http");
}

function roleFromPayload(value: unknown): PerformanceRole {
  if (!isRecord(value)) throw malformed("Role response contained an invalid item.");
  const id = idValue(value);
  const name = stringValue(firstDefined(value, ["name", "role_name", "title"]));
  if (id === undefined || !name) throw malformed("Role response is missing id or name.");

  const department = firstDefined(value, ["department_name", "department"]);
  const departmentName = stringValue(department) || (isRecord(department) ? stringValue(department.name) : undefined);
  return {
    id,
    name,
    ...(departmentName ? { department: departmentName } : {}),
    ...(stringValue(firstDefined(value, ["description", "role_description"]))
      ? { description: stringValue(firstDefined(value, ["description", "role_description"])) }
      : {}),
  };
}

function kpiFromPayload(value: unknown): PerformanceKpi {
  if (!isRecord(value)) throw malformed("KPI response contained an invalid item.");
  const id = idValue(value);
  const name = stringValue(firstDefined(value, ["name", "kpi_name", "metric_name", "title"]));
  if (id === undefined || !name) throw malformed("KPI response is missing id or name.");
  const description = stringValue(value.description);
  const unit = stringValue(firstDefined(value, ["unit", "measurement_unit"]));
  const weight = numberValue(value.weight);
  const trackingMode = stringValue(firstDefined(value, ["tracking_mode", "trackingMode"]));
  const active = typeof value.active === "boolean" ? value.active : undefined;
  return {
    id,
    name,
    ...(description ? { description } : {}),
    ...(unit ? { unit } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(trackingMode ? { trackingMode } : {}),
    ...(active !== undefined ? { active } : {}),
  };
}

function targetFromPayload(value: unknown, fallbackRoleId?: string | number): PerformanceTarget {
  if (!isRecord(value)) throw malformed("Target response contained an invalid item.");
  const id = idValue(value);
  const roleValue = firstDefined(value, ["role_id", "roleId"]);
  const roleId = typeof roleValue === "string" || typeof roleValue === "number" ? roleValue : fallbackRoleId;
  const name = stringValue(firstDefined(value, ["name", "target_name", "title"]));
  if (id === undefined || roleId === undefined || !name) {
    throw malformed("Target response is missing id, role id, or name.");
  }
  const targetValue = numberValue(firstDefined(value, ["target_value", "targetValue", "target"]));
  const weight = numberValue(value.weight);
  const frequency = stringValue(value.frequency);
  const unit = stringValue(firstDefined(value, ["unit", "measurement_unit"]));
  const status = stringValue(firstDefined(value, ["status", "state"])) || (value.active === true ? "active" : undefined);
  const sourceModule = stringValue(firstDefined(value, ["source_module", "sourceModule"]));
  return {
    id,
    roleId,
    name,
    ...(frequency ? { frequency } : {}),
    ...(targetValue !== undefined ? { targetValue } : {}),
    ...(unit ? { unit } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(status ? { status } : {}),
    ...(sourceModule ? { sourceModule } : {}),
  };
}

function progressFromPayload(value: unknown): PerformanceTargetProgress {
  if (!isRecord(value)) throw malformed("Target progress response contained an invalid item.");
  const target = targetFromPayload(value);
  const period = stringValue(firstDefined(value, ["period", "period_name"]));
  const periodStart = stringValue(firstDefined(value, ["period_start", "periodStart"]));
  const periodEnd = stringValue(firstDefined(value, ["period_end", "periodEnd"]));
  const actualValue = numberValue(firstDefined(value, ["actual_value", "actualValue", "actual"]));
  const achievementPercent = numberValue(firstDefined(value, ["achievement_percent", "achievementPercent", "completion_percent"]));
  const evidenceAvailable = typeof value.evidence_available === "boolean"
    ? value.evidence_available
    : typeof value.evidenceAvailable === "boolean" ? value.evidenceAvailable : undefined;
  const evidenceRef = stringValue(firstDefined(value, ["evidence_ref", "evidenceRef"]));
  return {
    ...target,
    ...(period ? { period } : {}),
    ...(periodStart ? { periodStart } : {}),
    ...(periodEnd ? { periodEnd } : {}),
    ...(actualValue !== undefined ? { actualValue } : {}),
    ...(achievementPercent !== undefined ? { achievementPercent } : {}),
    ...(evidenceAvailable !== undefined ? { evidenceAvailable } : {}),
    ...(evidenceRef ? { evidenceRef } : {}),
  };
}

async function getList<T>(endpoint: string, map: (value: unknown) => T): Promise<T[]> {
  const result = await apiRequest<unknown>(endpoint);
  if (result.status < 200 || result.status >= 300) throw httpError(result.status, result.error);
  return listPayload(result.data).map(map);
}

export function listRoles(): Promise<PerformanceRole[]> {
  return getList("/api/v1/roles/", roleFromPayload);
}

export function getRoleKpis(roleId: string | number): Promise<PerformanceKpi[]> {
  return getList(`/api/v1/roles/${encodeURIComponent(roleId)}/kpis`, kpiFromPayload);
}

export function getRoleTargetTemplates(roleId: string | number): Promise<PerformanceTarget[]> {
  return getList(`/api/v1/roles/${encodeURIComponent(roleId)}/target-templates`, (value) => targetFromPayload(value, roleId));
}

export function getMyTargets(): Promise<PerformanceTargetProgress[]> {
  return getList("/api/v1/employees/me/targets", progressFromPayload);
}
