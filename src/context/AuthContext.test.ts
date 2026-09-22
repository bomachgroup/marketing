import { describe, expect, it } from "vitest";
import { canAccessWithPermissions } from "./AuthContext";

describe("authenticated permission checks", () => {
  it("fails closed for a non-admin with no backend permission map", () => {
    expect(canAccessWithPermissions("dashboard", "view", "staff", {})).toBe(false);
  });

  it("allows an explicitly granted view permission", () => {
    expect(
      canAccessWithPermissions("dashboard", "view", "staff", {
        dashboard: ["view"],
      }),
    ).toBe(true);
  });

  it("denies direct access when the requested screen is not granted", () => {
    expect(
      canAccessWithPermissions("pipeline", "view", "staff", {
        dashboard: ["view"],
      }),
    ).toBe(false);
  });

  it("does not let wildcard permissions re-enable disabled screens", () => {
    expect(
      canAccessWithPermissions("role-governance", "view", "staff", {
        "*": ["*"],
      }),
    ).toBe(false);
  });

  it("uses the published Revenue Execution resource for supported screens", () => {
    const permissionMap = { revenue_execution: ["view", "create", "update"] };

    expect(canAccessWithPermissions("revenue-command", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("forecast", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("turnaround", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("lead-control", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("playbooks", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("okrs", "view", "staff", permissionMap)).toBe(true);
    expect(canAccessWithPermissions("revenue-command", "create", "staff", permissionMap)).toBe(true);
  });
});
