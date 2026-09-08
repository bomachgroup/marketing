import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OkrsPage } from "./OkrsPage";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: () => false,
  }),
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../context/ShellContext", () => ({
  useShell: () => ({ setTopbarConfig: vi.fn() }),
}));

vi.mock("./performance/PerformanceBridgePage", () => ({
  PerformanceBridgePage: ({ canManage }: { canManage: boolean }) => (
    <div data-testid="performance-bridge">Performance bridge: {String(canManage)}</div>
  ),
}));

afterEach(() => vi.clearAllMocks());

describe("OkrsPage compatibility route", () => {
  it("renders the supported performance bridge instead of the unsupported OKR editor", () => {
    render(<OkrsPage />);

    expect(screen.getByTestId("performance-bridge")).toHaveTextContent("Performance bridge: false");
    expect(screen.queryByText("OKR progress")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit Weekly Revenue & Marketing Targets")).not.toBeInTheDocument();
  });
});
