import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, setApiBaseUrl } from "./apiClient";

describe("API response handling", () => {
  beforeEach(() => {
    setApiBaseUrl("https://bomachauthtest.bgbot.app");
  });

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

    const result = await apiRequest("/api/v1/employees/department");

    expect(result).toEqual({
      status: 404,
      error: "The backend returned HTML instead of the expected JSON response (HTTP 404).",
    });
  });
});
