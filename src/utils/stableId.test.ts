import { describe, expect, it } from "vitest";
import { stableFallbackId } from "./stableId";

describe("stableFallbackId", () => {
  it("is deterministic for the same backend-derived values", () => {
    expect(stableFallbackId("action", "Lead 42", "2026-09-08")).toBe(
      stableFallbackId("action", "Lead 42", "2026-09-08"),
    );
  });

  it("keeps distinct backend-derived records distinct", () => {
    expect(stableFallbackId("action", "Lead 42")).not.toBe(
      stableFallbackId("action", "Lead 43"),
    );
  });

  it("does not use a random value when fields are empty", () => {
    expect(stableFallbackId("action")).toBe("action-empty");
  });
});
