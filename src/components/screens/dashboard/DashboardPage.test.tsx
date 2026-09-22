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

const response = <T,>(data: T) => ({ status: 200, data });

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
    vi.mocked(workdeskService.getPerformanceCard).mockResolvedValue(
      response(null as never),
    );
  });

  afterEach(() => cleanup());

  it("uses the supported Revenue Execution OKR endpoint", async () => {
    render(
      <ShellProvider>
        <DashboardPage />
      </ShellProvider>,
    );

    await waitFor(() => expect(screen.getByText("Revenue Execution OKRs")).toBeInTheDocument());

    expect(marketingService.getRevenueOkrs).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Revenue objectives and key results are available/)).toBeInTheDocument();
  });
});
