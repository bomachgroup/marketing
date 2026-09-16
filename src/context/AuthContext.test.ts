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
});
