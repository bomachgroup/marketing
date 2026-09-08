import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { marketingService } from "../../../services/api/marketingService";
import { workdeskService } from "../../../services/api/workdeskService";
import { ShellProvider } from "../../../context/ShellContext";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "manager@example.com" },
    employeeDetails: null,
  }),
}));

vi.mock("../../../services/api/marketingService", () => ({
  marketingService: {
    getLeadSummary: vi.fn(),
    getLeads: vi.fn(),
    getPipelineSummary: vi.fn(),
    getRevenueTargetsSummary: vi.fn(),
    getActivityScorecard: vi.fn(),
    getRevenueOkrs: vi.fn(),
    getApprovals: vi.fn(),
    getContentBriefs: vi.fn(),
  },
}));

vi.mock("../../../services/api/workdeskService", () => ({
  workdeskService: {
    getPerformanceCard: vi.fn(),
  },
}));

const response = (data: unknown) => ({ status: 200, data });

describe("DashboardPage performance contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketingService.getLeadSummary).mockResolvedValue(response({}));
    vi.mocked(marketingService.getLeads).mockResolvedValue(response([]));
    vi.mocked(marketingService.getPipelineSummary).mockResolvedValue(response({}));
    vi.mocked(marketingService.getRevenueTargetsSummary).mockResolvedValue(response({}));
    vi.mocked(marketingService.getActivityScorecard).mockResolvedValue(response([]));
    vi.mocked(marketingService.getRevenueOkrs).mockResolvedValue(response([]));
    vi.mocked(marketingService.getApprovals).mockResolvedValue(response([]));
    vi.mocked(marketingService.getContentBriefs).mockResolvedValue(response([]));
    vi.mocked(workdeskService.getPerformanceCard).mockResolvedValue(response(null));
  });

  afterEach(() => cleanup());

  it("does not consume or present the unsupported company OKR endpoint", async () => {
    render(
      <ShellProvider>
        <DashboardPage />
      </ShellProvider>,
    );

    await waitFor(() => expect(screen.getByText("Company OKRs unavailable")).toBeInTheDocument());

    expect(marketingService.getRevenueOkrs).not.toHaveBeenCalled();
    expect(screen.getByText(/Objectives and OKRs are not available from the current backend/)).toBeInTheDocument();
  });
});
