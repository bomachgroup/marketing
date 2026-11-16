import { describe, expect, it } from "vitest";
import { accessibleNavGroups, normalizeMarketingPathname, screenTitleFromPath } from "./navigation";

describe("permission-aware navigation", () => {
  it("shows only screens explicitly granted by the backend", () => {
    const visible = accessibleNavGroups(
      "staff",
      { dashboard: ["view"], pipeline: ["view"] },
      (resource) => resource === "dashboard" || resource === "pipeline",
    );
    const screens = visible.flatMap((group) => group.items.map((item) => item.s));

    expect(screens).toEqual(["dashboard", "pipeline"]);
  });

  it("does not expose role defaults when the permission map is unavailable", () => {
    const visible = accessibleNavGroups("staff", {}, () => false);

    expect(visible).toEqual([]);
  });

  it("groups permitted screens into the navigation sections in presentation order", () => {
    const permitted = new Set(["campaigns", "pipeline", "marketing-meetings", "workdesk"]);
    const visible = accessibleNavGroups("staff", {}, (resource) => permitted.has(resource));

    expect(visible.map((group) => group.g)).toEqual([
      "Integrated work",
      "Marketing",
      "Campaign Operations",
    ]);
    expect(visible.flatMap((group) => group.items.map((item) => item.s))).toEqual([
      "workdesk",
      "pipeline",
      "campaigns",
      "marketing-meetings",
    ]);
  });
});

describe("Marketing base path", () => {
  it("normalizes prefixed routes for navigation and page titles", () => {
    expect(normalizeMarketingPathname("/marketing/campaigns")).toBe("/campaigns");
    expect(screenTitleFromPath("/marketing/campaigns")).toBe("Campaign operating system");
    expect(normalizeMarketingPathname("/dashboard")).toBe("/dashboard");
  });
});
