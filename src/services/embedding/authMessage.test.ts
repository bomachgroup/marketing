import { describe, expect, it, vi } from "vitest";
import {
  AUTH_READY_MESSAGE,
  isTrustedAuthMessage,
  parentOriginFromReferrer,
  sendAuthReady,
} from "./authMessage";

describe("embedded authentication messages", () => {
  it("emits a non-secret ready message", () => {
    expect(AUTH_READY_MESSAGE).toEqual({ type: "BOMACH_AUTH_READY" });
    expect(JSON.stringify(AUTH_READY_MESSAGE)).not.toMatch(/token|email|name/i);
  });

  it("derives only the origin from a parent referrer", () => {
    expect(parentOriginFromReferrer("http://localhost:8085/#/company")).toBe("http://localhost:8085");
    expect(parentOriginFromReferrer("not-a-url")).toBeNull();
  });

  it("requires both the expected origin and the actual parent window", () => {
    const parent = window.parent;
    const accepted = new MessageEvent("message", {
      origin: "http://localhost:8085",
      source: parent,
      data: { type: "BOMACH_AUTH_TOKEN", token: "access" },
    });
    const wrongOrigin = new MessageEvent("message", {
      origin: "https://attacker.example",
      source: parent,
      data: { type: "BOMACH_AUTH_TOKEN", token: "access" },
    });
    const wrongSource = new MessageEvent("message", {
      origin: "http://localhost:8085",
      source: {} as Window,
      data: { type: "BOMACH_AUTH_TOKEN", token: "access" },
    });

    expect(isTrustedAuthMessage(accepted, parent, "http://localhost:8085")).toBe(true);
    expect(isTrustedAuthMessage(wrongOrigin, parent, "http://localhost:8085")).toBe(false);
    expect(isTrustedAuthMessage(wrongSource, parent, "http://localhost:8085")).toBe(false);
  });

  it("does not treat an arbitrary message containing a token as authentication", () => {
    const event = new MessageEvent("message", {
      origin: "http://localhost:8085",
      source: window.parent,
      data: { token: "access" },
    });

    expect(isTrustedAuthMessage(event, window.parent, "http://localhost:8085")).toBe(false);
  });

  it("sends readiness to the derived parent origin without credentials", () => {
    const postMessage = vi.fn();
    const parent = { postMessage } as unknown as Window;

    sendAuthReady(parent, "http://localhost:8085");

    expect(postMessage).toHaveBeenCalledWith(AUTH_READY_MESSAGE, "http://localhost:8085");
  });
});
