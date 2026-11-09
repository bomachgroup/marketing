import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      email: "staff@example.test",
      username: "staff",
      is_verified: true,
      created_at: "",
      permissions: { dashboard: ["view"], services: ["list"] },
    },
    currentRole: "manager",
    hasPermission: () => true,
  }),
}));

import AppSwitcher from "./AppSwitcher";

describe("Marketing AppSwitcher", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
  });

  it("opens the remembered workspace route in a separate tab", () => {
    window.localStorage.setItem(
      "bomach.workspace-memory.v1",
      JSON.stringify({
        version: 1,
        userId: "7",
        lastVisited: { app: "services", href: "/services/app/dashboard" },
        apps: {
          os: "/hr/employees?view=active",
          services: "/services/app/dashboard",
          marketing: "/marketing/dashboard",
        },
        savedAt: Date.now(),
      }),
    );

    render(<AppSwitcher />);
    fireEvent.click(screen.getByLabelText("Switch workspace"));

    const servicesLink = screen.getByRole("link", {
      name: "Open Services in a new tab",
    });
    expect(servicesLink).toHaveAttribute("target", "_blank");
    expect(servicesLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(servicesLink.getAttribute("href")).toMatch(
      /\/services\/app\/dashboard$/,
    );
  });

  it("clamps the menu width to the viewport from mobile through desktop sizes", () => {
    render(<AppSwitcher />);
    fireEvent.click(screen.getByLabelText("Switch workspace"));

    const menu = screen.getByLabelText("Available workspaces");
    const details = menu.closest("details") as HTMLDetailsElement;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    for (const width of [
      320, 360, 375, 480, 600, 699, 700, 900, 1100, 1280, 1440, 1600,
    ]) {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });
      fireEvent.resize(window);
      expect(menu.style.width).toBe(`${Math.min(296, width - 24)}px`);
    }
  });
});
