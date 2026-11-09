/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, type EmployeeDetailsResponse, type UserProfile, type UserRoleResponse } from "../services/api/authService";
import { clearLegacyStoredAuth, SESSION_ESTABLISHED_KEY } from "../services/api/apiClient";
import { firstAccessibleScreen } from "../navigation";
import { clearWorkspaceMemory } from "../shared/auth/workspace-memory";

interface AuthContextValue {
  user: UserProfile | null;
  userRole: UserRoleResponse | null;
  employeeDetails: EmployeeDetailsResponse | null;
  permissions: Record<string, string[]>;
  currentRole: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  authError: string | null;
  hasPermission: (resource: string, action?: string) => boolean;
  getFirstAccessibleScreen: () => string;
  retrySession: () => void;
  logout: () => void;
}

const SCREEN_TO_RESOURCE_MAP: Record<string, string[]> = {
  dashboard: ["dashboard", "marketing_dashboard", "stats"],
  workdesk: ["workdesk", "employees", "role_daily_routines", "target_reports"],
  pipeline: ["pipeline", "leads", "deals", "crm"],
  "leads-detail": ["leads", "pipeline"],
  "lead-journal": ["leads", "followups", "inquiries"],
  calendar: ["calendar", "content", "content_calendar", "content_calendar_briefs"],
  campaigns: ["marketing_campaigns", "campaigns", "campaign"],
  analytics: ["analytics", "marketing_analytics", "marketing_dashboard"],
  okrs: ["revenue_execution", "employee_targets", "role_kpis", "kpis", "okrs", "targets"],
  whatsapp: ["whatsapp", "messages", "inquiries"],
  partners: ["partners", "partner_agreements"],
  design: ["design", "tasks", "projects"],
  support: ["support", "service_requests", "tickets"],
  "new-lead": ["leads", "service_leads"],
  "team-directory": ["employees", "team"],
  media: ["media", "media_library", "content_media_library"],
  "revenue-command": ["revenue_execution", "revenue_command"],
  "daily-execution": ["revenue_execution", "daily_execution", "revenue_execution_daily_execution"],
  "lead-control": ["revenue_execution", "lead_controltower", "lead_control", "revenue_execution_lead_control"],
  "funnel-audit": ["funnel_audit", "revenue_execution_funnel_audit"],
  playbooks: ["revenue_execution", "role_success_playbook", "role_sops", "playbooks"],
  "content-studio": ["content", "content_studio"],
  coaching: ["role_training_requirements", "training_programs", "coaching"],
  forecast: ["revenue_execution", "forecast", "revenue_forecast"],
  retention: ["retention", "referrals"],
  compliance: ["compliance_records", "compliance_audits", "compliance"],
  turnaround: ["revenue_execution", "turnaround", "turnaround_plan"],
  integrations: ["integrations"],
  "email-center": ["email_center", "email", "marketing_email"],
  "media-register": ["media_register", "traditional_media"],
  "realtor-portal": ["realtors", "partners"],
  "partner-portal": ["partners", "partner_agreements", "partner_portal"],
  handoff: ["handoff", "clients", "sales"],
  "role-governance": ["roles", "permissions", "role_governance"],
  approvals: ["approval_requests", "approval_flows", "approvals"],
  "audit-log": ["audit_logs", "logs"],
  "marketing-meetings": ["meetings", "marketing_meetings", "marketing-meetings"],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPermissionMap(value: unknown): value is Record<string, string[]> {
  return isRecord(value) && Object.values(value).every(
    (actions) => Array.isArray(actions) && actions.every((action) => typeof action === "string"),
  );
}

function roleNameOf(user: UserProfile): string {
  return typeof user.role === "string" ? user.role : user.role?.name || "Staff";
}

function mapRoleNameToKey(roleName: string, user: UserProfile): string {
  const value = `${roleName} ${user.email} ${user.username} ${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
  if (value.includes("ceo") || value.includes("founder") || value.includes("chief executive") || value.includes("admin")) return "ceo";
  if (value.includes("coordinator")) return "coord";
  if (value.includes("business development") || value.includes("business developer") || value.includes("bizdev")) return "bizdev";
  if (value.includes("software") || value.includes("analyst") || value.includes("analytics") || value.includes("data")) return "analyst";
  if (value.includes("manager") || value.includes("head") || value.includes("lead")) return "mgr";
  if (value.includes("digital") || value.includes("marketer")) return "digital";
  if (value.includes("sales") || value.includes("rep")) return "sales";
  if (value.includes("content") || value.includes("creator") || value.includes("writer")) return "content";
  if (value.includes("design") || value.includes("graphic")) return "graphic";
  if (value.includes("care") || value.includes("support")) return "care";
  if (value.includes("partner") || value.includes("realtor")) return "partner";
  return "mgr";
}

export function permissionsFromRoleResponse(
  role: UserRoleResponse | null | undefined,
): Record<string, string[]> {
  return isPermissionMap(role?.permissions) ? role.permissions : {};
}

export function canAccessWithPermissions(
  resource: string,
  action: string,
  _roleKey: string,
  permissionMap: Record<string, string[]>,
): boolean {
  const normalizedResource = resource.toLowerCase().replace(/^\//, "");
  if (["integrations", "funnel-audit", "compliance", "retention", "whatsapp", "design", "role-governance", "audit-log"].includes(normalizedResource)) return false;

  const hasWildcard = ["*", "all"].some((key) =>
    permissionMap[key]?.some((granted) => ["*", "all"].includes(granted.toLowerCase())),
  );
  if (hasWildcard) return true;

  const clean = normalizedResource.replace(/-/g, "_");
  const candidates = new Set([clean, normalizedResource, ...(SCREEN_TO_RESOURCE_MAP[clean] || []), ...(SCREEN_TO_RESOURCE_MAP[normalizedResource] || [])].map((key) => key.toLowerCase()));
  const normalizedCandidates = new Set([...candidates].map((key) => key.replace(/_/g, "")));
  for (const [key, grants] of Object.entries(permissionMap)) {
    if (!candidates.has(key.toLowerCase()) && !normalizedCandidates.has(key.toLowerCase().replace(/_/g, ""))) continue;
    const normalizedGrants = grants.map((grant) => grant.toLowerCase());
    if (normalizedGrants.includes("*") || normalizedGrants.includes("all")) return true;
    if (action.toLowerCase() === "view") {
      if (["view", "read", "get", "list", "access"].some((grant) => normalizedGrants.includes(grant))) return true;
      continue;
    }
    if (normalizedGrants.includes(action.toLowerCase())) return true;
  }
  return false;
}

function userRoleFromProfile(user: UserProfile, permissions: Record<string, string[]>): UserRoleResponse {
  const role = typeof user.role === "object" && user.role ? user.role : null;
  return {
    id: role?.id ?? 0,
    name: roleNameOf(user),
    permissions,
    created_at: "",
    updated_at: "",
  };
}

function employeeFromProfile(user: UserProfile, roleName: string): EmployeeDetailsResponse {
  return {
    id: user.id,
    employee_id: String(user.id),
    email: user.email,
    full_name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || user.email,
    phone: user.phone_number || "",
    department_id: "",
    position: roleName,
    role_name: roleName,
    designation: roleName,
    department_name: "",
    branch_name: "",
    is_active: true,
  };
}

function clearLegacyQueryParameters(): void {
  const blocked = ["token", "access_token", "refreshToken", "refresh_token", "apiBaseUrl", "backendUrl", "apiUrl", "embed", "embedded"];
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of blocked) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRoleResponse | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailsResponse | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [currentRole, setCurrentRole] = useState("staff");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const restoreSession = useCallback(async () => {
    clearLegacyStoredAuth();
    clearLegacyQueryParameters();

    const result = await authService.getCurrentUser();
    if (result.data && isRecord(result.data) && (typeof result.data.id === "number" || typeof result.data.id === "string") && typeof result.data.email === "string") {
      const profile = result.data as UserProfile;
      const granted = isPermissionMap(profile.permissions) ? profile.permissions : {};
      const roleName = roleNameOf(profile);
      const roleKey = mapRoleNameToKey(roleName, profile);
      setUser(profile);
      setPermissions(granted);
      setUserRole(userRoleFromProfile(profile, granted));
      setEmployeeDetails(employeeFromProfile(profile, roleName));
      setCurrentRole(roleKey);
      setIsLoggedIn(true);
      try {
        window.sessionStorage.setItem(SESSION_ESTABLISHED_KEY, "1");
      } catch {
        // Session storage is optional; the cookie remains authoritative.
      }
      setIsLoading(false);
      return;
    }

    setUser(null);
    setUserRole(null);
    setEmployeeDetails(null);
    setPermissions({});
    setCurrentRole("staff");
    setIsLoggedIn(false);
    if (result.status !== 401 && result.status !== 403) {
      setAuthError(result.error || "Could not verify your Bomach session. Check your connection and retry.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void restoreSession();
    });
    return () => { active = false; };
  }, [reloadKey, restoreSession]);

  const hasPermission = useCallback(
    (resource: string, action = "view") => canAccessWithPermissions(resource, action, currentRole, permissions),
    [currentRole, permissions],
  );
  const getFirstAccessibleScreen = useCallback(
    () => firstAccessibleScreen(currentRole, permissions, hasPermission),
    [currentRole, hasPermission, permissions],
  );
  const retrySession = useCallback(() => {
    setIsLoading(true);
    setAuthError(null);
    setReloadKey((key) => key + 1);
  }, []);
  const logout = useCallback(() => {
    void authService.logout();
    clearLegacyStoredAuth();
    if (user) clearWorkspaceMemory(user.id);
    try {
      window.sessionStorage.removeItem(SESSION_ESTABLISHED_KEY);
    } catch {
      // Ignore unavailable browser storage.
    }
    setUser(null);
    setUserRole(null);
    setEmployeeDetails(null);
    setPermissions({});
    setIsLoggedIn(false);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, userRole, employeeDetails, permissions, currentRole, isLoggedIn,
      isLoading, authError, hasPermission, getFirstAccessibleScreen, retrySession, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
