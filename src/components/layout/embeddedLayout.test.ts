import { describe, expect, it } from "vitest";
import { getEmbeddedLayoutFlags } from "./embeddedLayout";

describe("embedded Marketing layout flags", () => {
  it("hides the child navigation when flags are in the hash route", () => {
    expect(
      getEmbeddedLayoutFlags({
        search: "",
        hash: "#/dashboard?embed=true&hideSidebar=true",
      }),
    ).toEqual({
      isEmbed: true,
      hideSidebar: true,
      hideTopbar: true,
    });
  });

  it("keeps the standalone Marketing sidebar visible", () => {
    expect(
      getEmbeddedLayoutFlags({
        search: "",
        hash: "#/dashboard",
      }),
    ).toEqual({
      isEmbed: false,
      hideSidebar: false,
      hideTopbar: false,
    });
  });
});
