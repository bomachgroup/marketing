import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  BROWSER_REQUEST_HEADER,
  BROWSER_REQUEST_VALUE,
  normalizeEndpoint,
} from "./apiClient";

describe("API response handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports a non-JSON backend response without leaking a JSON parse exception", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!DOCTYPE html><html><body>Not found</body></html>", {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    const result = await apiRequest("/employees/department");

    expect(result).toEqual({
      status: 404,
      error: "The backend returned HTML instead of the expected JSON response (HTTP 404).",
    });
  });

  it("uses same-origin cookie credentials and marks browser writes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/v1/leads", { method: "POST", body: JSON.stringify({ name: "Lead" }) });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/leads/", expect.objectContaining({
      credentials: "include",
      cache: "no-store",
    }));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(request.headers);
    expect(headers.get(BROWSER_REQUEST_HEADER)).toBe(BROWSER_REQUEST_VALUE);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("refreshes the browser session once and retries an unauthorized request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Expired" }), { status: 401, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/leads")).resolves.toMatchObject({ status: 200, data: { results: [] } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/v1/auth/browser/refresh");
    const refreshRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(refreshRequest.credentials).toBe("include");
    expect(new Headers(refreshRequest.headers).get(BROWSER_REQUEST_HEADER)).toBe(BROWSER_REQUEST_VALUE);
  });

  it("rejects absolute API origins and normalizes prefix-relative endpoints", () => {
    expect(normalizeEndpoint("leads/17")).toBe("/api/v1/leads/17/");
    expect(normalizeEndpoint("/api/v1/auth/me")).toBe("/api/v1/auth/me");
    expect(() => normalizeEndpoint("https://api.example.test/api/v1/leads")).toThrow(/shared Bomach host/);
  });
});
