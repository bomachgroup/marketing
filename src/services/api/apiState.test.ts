import { describe, expect, it } from "vitest";
import { classifyApiResponse } from "./apiState";

describe("classifyApiResponse", () => {
  it("keeps forbidden responses distinct from empty data", () => {
    expect(classifyApiResponse({ status: 403, error: "Forbidden" })).toBe("forbidden");
    expect(classifyApiResponse({ status: 200, data: [] })).toBe("empty");
  });

  it("marks a missing endpoint as unsupported", () => {
    expect(classifyApiResponse({ status: 404, error: "Not found" })).toBe("unsupported");
  });

  it("marks server and network failures as retryable errors", () => {
    expect(classifyApiResponse({ status: 503, error: "Service unavailable" })).toBe("networkError");
    expect(classifyApiResponse({ status: 500, error: "Connection failed" })).toBe("networkError");
  });
});
