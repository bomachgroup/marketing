import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaybooksPage } from "./PlaybooksPage";
import { marketingService } from "../../services/api/marketingService";
import { ShellProvider } from "../../context/ShellContext";

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../services/api/marketingService", () => ({
  marketingService: {
    getSalesPlaybooks: vi.fn(),
    createSalesPlaybook: vi.fn(),
  },
}));

const mockedGetSalesPlaybooks = vi.mocked(marketingService.getSalesPlaybooks);

describe("PlaybooksPage", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it("retains the last successful guide when a filter refresh fails", async () => {
    mockedGetSalesPlaybooks
      .mockResolvedValueOnce({ status: 200, data: { items: [{ id: 5, title: "Live Guide", objective: "Qualify consistently" }] } })
      .mockResolvedValueOnce({ status: 503, error: "Service unavailable" });

    render(
      <ShellProvider>
        <PlaybooksPage />
      </ShellProvider>,
    );

    await waitFor(() => expect(screen.getByText("Live Guide")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Real Estate" }));
    fireEvent.click(screen.getByRole("button", { name: "Benji" }));

    await waitFor(() => expect(screen.getByText("Service unavailable")).toBeInTheDocument());
    expect(screen.getByText("Live Guide")).toBeInTheDocument();
  });
});
