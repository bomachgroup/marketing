import { ROLES } from "./data/defaults";
import type { NavGroup } from "./data/types";

export const SCREEN_TITLES: Record<string, string> = {
  dashboard: "Command centre",
  pipeline: "CRM pipeline",
  calendar: "Content calendar",
  campaigns: "Campaign operating system",
  analytics: "Analytics & reports",
  okrs: "Targets & progress",
  whatsapp: "WhatsApp manager",
  partners: "Partners & media",
  design: "Design task board",
  support: "Customer support",
  "new-lead": "Register new lead",
  "team-directory": "Team directory",
  media: "Media library",
  "revenue-command": "Revenue recovery command",
  "daily-execution": "Daily execution center",
  "lead-control": "Lead control tower",
  "funnel-audit": "Funnel leak audit",
  playbooks: "Sales playbooks",
  "content-studio": "Content revenue studio",
  coaching: "Sales coaching & enablement",
  forecast: "Revenue forecast",
  retention: "Retention & referrals",
  compliance: "Marketing compliance",
  turnaround: "13-week turnaround plan",
  workdesk: "My work desk",
  "lead-journal": "Lead 360 journal",
  integrations: "Channel integrations",
  "email-center": "Email marketing",
  "media-register": "Traditional media register",
  "realtor-portal": "External realtor network",
  "partner-portal": "Partner work portal",
  handoff: "Sales & allocation handoff",
  "role-governance": "Role framework & permissions",
  approvals: "Approval center",
  "audit-log": "Activity & audit log",
  "marketing-meetings": "Marketing meetings & decisions",
  "leads-detail": "Lead detail",
};

export const DISABLED_SCREENS = new Set([
  "funnel-audit",
  "compliance",
  "retention",
  "whatsapp",
  "design",
  "role-governance",
  "audit-log",
]);

export const NAVIGATION_GROUP_PRESENTATION: Record<
  string,
  { section: string; icon: string; order: number }
> = {
  "Integrated work": { section: "Workspace", icon: "ti-device-desktop", order: 0 },
  "Revenue execution": { section: "Workspace", icon: "ti-command", order: 1 },
  Overview: { section: "Workspace", icon: "ti-layout-dashboard", order: 2 },
  "Revenue controls": { section: "Workspace", icon: "ti-radar-2", order: 3 },
  Marketing: { section: "Marketing", icon: "ti-ad", order: 4 },
  Operations: { section: "Operations", icon: "ti-briefcase", order: 5 },
  Team: { section: "People", icon: "ti-users-group", order: 6 },
  "Enablement & growth": { section: "Marketing", icon: "ti-book-2", order: 7 },
  "Commercial operations": { section: "Operations", icon: "ti-transfer", order: 8 },
  Governance: { section: "Governance", icon: "ti-lock-access", order: 9 },
  "Campaign Operations": { section: "Marketing", icon: "ti-calendar-event", order: 10 },
};

const SCREEN_NAVIGATION_GROUP: Record<string, string> = {
  workdesk: "Integrated work",
  "lead-journal": "Integrated work",
  "revenue-command": "Revenue execution",
  "daily-execution": "Revenue execution",
  turnaround: "Revenue execution",
  dashboard: "Overview",
  okrs: "Overview",
  "lead-control": "Revenue controls",
  "funnel-audit": "Revenue controls",
  forecast: "Revenue controls",
  compliance: "Revenue controls",
  pipeline: "Marketing",
  campaigns: "Marketing",
  calendar: "Marketing",
  media: "Marketing",
  design: "Marketing",
  partners: "Operations",
  analytics: "Operations",
  support: "Operations",
  whatsapp: "Operations",
  "team-directory": "Team",
  "new-lead": "Team",
  playbooks: "Enablement & growth",
  coaching: "Enablement & growth",
  "content-studio": "Enablement & growth",
  retention: "Enablement & growth",
  "email-center": "Commercial operations",
  "media-register": "Commercial operations",
  handoff: "Commercial operations",
  "realtor-portal": "Commercial operations",
  "partner-portal": "Commercial operations",
  "role-governance": "Governance",
  approvals: "Governance",
  "audit-log": "Governance",
  "marketing-meetings": "Campaign Operations",
};

export function screenPath(screen: string): string {
  return "/" + screen;
}

export function roleFirstScreen(roleKey: string): string {
  return ROLES[roleKey]?.nav[0]?.items[0]?.s ?? "dashboard";
}

function allRoleNavGroups(): NavGroup[] {
  return Object.values(ROLES).flatMap((role) => role.nav);
}

export function accessibleNavGroups(
  _roleKey: string,
  _permissions: Record<string, string[]>,
  hasPermission: (resource: string, action?: string) => boolean,
): NavGroup[] {
  const sourceGroups = allRoleNavGroups();
  const seenScreens = new Set<string>();
  const groupedItems = new Map<string, NavGroup["items"]>();

  sourceGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (DISABLED_SCREENS.has(item.s)) return;
      if (item.s === "integrations") return;
      if (seenScreens.has(item.s)) return;
      if (!hasPermission(item.s, "view")) return;
      seenScreens.add(item.s);

      const groupName = SCREEN_NAVIGATION_GROUP[item.s] ?? group.g;
      const items = groupedItems.get(groupName) ?? [];
      items.push(item);
      groupedItems.set(groupName, items);
    });
  });

  return [...groupedItems.entries()]
    .sort(([left], [right]) => {
      const leftOrder = NAVIGATION_GROUP_PRESENTATION[left]?.order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = NAVIGATION_GROUP_PRESENTATION[right]?.order ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.localeCompare(right);
    })
    .map(([groupName, items]) => ({ g: groupName, items }));
}

export function firstAccessibleScreen(
  roleKey: string,
  permissions: Record<string, string[]>,
  hasPermission: (resource: string, action?: string) => boolean,
): string {
  return (
    accessibleNavGroups(roleKey, permissions, hasPermission)[0]?.items[0]?.s ||
    "dashboard"
  );
}

export function screenTitleFromPath(pathname: string): string {
  const seg = normalizeMarketingPathname(pathname).replace(/^\//, "");
  return SCREEN_TITLES[seg] ?? seg;
}

export function normalizeMarketingPathname(pathname: string): string {
  if (pathname === "/marketing") return "/";
  if (pathname.startsWith("/marketing/")) return pathname.slice("/marketing".length);
  return pathname;
}

export function isMarketingWorkspacePath(pathname: string): boolean {
  return pathname === "/marketing" || pathname.startsWith("/marketing/");
}

export function hasAccessibleMarketingDestination(
  roleKey: string,
  permissions: Record<string, string[]>,
  hasPermission: (resource: string, action?: string) => boolean,
): boolean {
  return accessibleNavGroups(roleKey, permissions, hasPermission).length > 0;
}
