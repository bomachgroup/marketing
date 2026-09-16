import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiBaseUrl } from "./apiClient";
import { clearAccessToken, setAccessToken } from "./authTokenStore";
import {
  PerformanceApiError,
  getMyTargets,
  getRoleKpis,
  getRoleTargetTemplates,
  listRoles,
} from "./performanceApi";

const baseUrl = "https://bomachauthtest.bgbot.app";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("performance API adapter", () => {
  beforeEach(() => {
    setApiBaseUrl(baseUrl);
    setAccessToken("test-access-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearAccessToken();
  });

  it("lists roles using the supported roles endpoint and authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        results: [
          { id: 7, name: "Growth Manager", department: { name: "Marketing" } },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listRoles()).resolves.toEqual([
      { id: 7, name: "Growth Manager", department: "Marketing" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/v1/roles/`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
        }),
      }),
    );
  });

  it("maps role KPIs and target templates from supported envelopes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          data: [{ id: "kpi-1", name: "Qualified leads", unit: "leads", weight: 25 }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          items: [
            {
              id: 3,
              role_id: 9,
              name: "Qualified leads target",
              frequency: "monthly",
              target_value: "40",
              unit: "leads",
              active: true,
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getRoleKpis(9)).resolves.toEqual([
      { id: "kpi-1", name: "Qualified leads", unit: "leads", weight: 25 },
    ]);
    await expect(getRoleTargetTemplates(9)).resolves.toEqual([
      {
        id: 3,
        roleId: 9,
        name: "Qualified leads target",
        frequency: "monthly",
        targetValue: 40,
        unit: "leads",
        status: "active",
      },
    ]);
  });

  it("maps employee target progress and preserves actual evidence fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          targets: [
            {
              id: 11,
              role_id: 9,
              name: "Revenue target",
              target_value: 100000,
              actual_value: 72500,
              achievement_percent: 72.5,
              evidence_available: true,
              period: "2026-08",
              period_start: "2026-08-01",
              period_end: "2026-08-31",
              evidence_ref: "campaign:CMP-2401",
            },
          ],
        }),
      ),
    );

    await expect(getMyTargets()).resolves.toEqual([
      {
        id: 11,
        roleId: 9,
        name: "Revenue target",
        targetValue: 100000,
        actualValue: 72500,
        achievementPercent: 72.5,
        evidenceAvailable: true,
        period: "2026-08",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        evidenceRef: "campaign:CMP-2401",
      },
    ]);
  });

  it("returns an empty list for a valid empty response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ results: [] })));

    await expect(listRoles()).resolves.toEqual([]);
  });

  it.each([403, 404])("exposes HTTP %s instead of treating it as empty success", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ detail: "Denied" }, status)));

    await expect(listRoles()).rejects.toMatchObject({ status });
  });

  it("rejects malformed successful payloads with a typed adapter error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ unexpected: true })));

    await expect(listRoles()).rejects.toBeInstanceOf(PerformanceApiError);
  });
});
