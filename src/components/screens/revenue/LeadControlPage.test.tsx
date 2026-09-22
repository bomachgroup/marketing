import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadControlPage } from "./LeadControlPage";
import { marketingService } from "../../../services/api/marketingService";
import { ShellProvider } from "../../../context/ShellContext";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../../services/api/marketingService", () => ({
  marketingService: {
    getLeadControl: vi.fn(),
    logLeadActivity: vi.fn(),
    updateLeadStage: vi.fn(),
    autoAssignLeads: vi.fn(),
    repairLeadNextActions: vi.fn(),
  },
}));

const mockedGetLeadControl = vi.mocked(marketingService.getLeadControl);

describe("LeadControlPage", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it("retains the last successful lead rows when a refresh fails", async () => {
    mockedGetLeadControl
      .mockResolvedValueOnce({
        status: 200,
        data: { items: [{ id: 7, full_name: "Ada Lovelace", status: "new", value: 1000 }] },
      })
      .mockResolvedValueOnce({ status: 503, error: "Service unavailable" });

    render(
      <ShellProvider>
        <LeadControlPage />
      </ShellProvider>,
    );
    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Search name, source, division..."), {
      target: { value: "x" },
    });
    await waitFor(() => expect(screen.getByText("Service unavailable")).toBeInTheDocument());
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
