import { afterEach, describe, expect, it, vi } from "vitest";

describe("embedded token storage", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.resetModules();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("does not ingest an access token from the URL", async () => {
    window.history.replaceState({}, "", "/?token=secret-from-url&refreshToken=refresh-from-url");
    const store = await import("./authTokenStore");

    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
  });
});
