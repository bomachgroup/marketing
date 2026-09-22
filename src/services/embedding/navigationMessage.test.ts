import { describe, expect, it, vi } from "vitest";
import { requestFlutterNewLeadRoute } from "./navigationMessage";

describe("Marketing-to-Flutter route synchronization", () => {
  it("requests the Flutter New Lead route only for the new-lead screen", () => {
    const parent = { postMessage: vi.fn() } as unknown as Window;

    expect(
      requestFlutterNewLeadRoute(
        "/new-lead",
        parent,
        "http://localhost:8085",
      ),
    ).toBe(true);
    expect(parent.postMessage).toHaveBeenCalledWith(
      "BOMACH_NAVIGATE_MARKETING_NEW_LEAD",
      "http://localhost:8085",
    );
    expect(
      requestFlutterNewLeadRoute(
        "/lead-journal",
        parent,
        "http://localhost:8085",
      ),
    ).toBe(false);
    expect(parent.postMessage).toHaveBeenCalledTimes(1);
  });

  it("does not send a navigation message without a parent origin", () => {
    const parent = { postMessage: vi.fn() } as unknown as Window;

    expect(requestFlutterNewLeadRoute("/new-lead", parent, null)).toBe(false);
    expect(parent.postMessage).not.toHaveBeenCalled();
  });
});
