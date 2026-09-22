import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMyTargets,
  getRoleKpis,
  getRoleTargetTemplates,
  listRoles,
} from "../../../services/api/performanceApi";
import { PerformanceBridgePage } from "./PerformanceBridgePage";
import { workdeskService } from "../../../services/api/workdeskService";
import { marketingService } from "../../../services/api/marketingService";

vi.mock("../../../services/api/performanceApi", () => ({
  getMyTargets: vi.fn(),
  getRoleKpis: vi.fn(),
  getRoleTargetTemplates: vi.fn(),
  listRoles: vi.fn(),
}));

vi.mock("../../../services/api/workdeskService", () => ({
  workdeskService: {
    createTargetReport: vi.fn(),
  },
}));

vi.mock("../../../services/api/marketingService", () => ({
  marketingService: {
    getRevenueOkrs: vi.fn(),
    getRevenueTargetsSummary: vi.fn(),
    createRevenueObjective: vi.fn(),
  },
}));

const mockedListRoles = vi.mocked(listRoles);
const mockedGetRoleKpis = vi.mocked(getRoleKpis);
const mockedGetRoleTargetTemplates = vi.mocked(getRoleTargetTemplates);
const mockedGetMyTargets = vi.mocked(getMyTargets);
const mockedCreateTargetReport = vi.mocked(workdeskService.createTargetReport);
const mockedGetRevenueOkrs = vi.mocked(marketingService.getRevenueOkrs);
const mockedGetRevenueTargetsSummary = vi.mocked(marketingService.getRevenueTargetsSummary);
const mockedCreateRevenueObjective = vi.mocked(marketingService.createRevenueObjective);

describe("PerformanceBridgePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetRevenueOkrs.mockResolvedValue({
      status: 200,
      data: { items: [{ id: 1, title: "Improve conversion", key_results: [] }] },
    });
    mockedGetRevenueTargetsSummary.mockResolvedValue({
      status: 200,
      data: { total_targets: 3 },
    });
    mockedCreateRevenueObjective.mockResolvedValue({ status: 201, data: { id: 2 } });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading state while role performance data is requested", () => {
    mockedListRoles.mockReturnValue(new Promise(() => undefined));
    mockedGetMyTargets.mockReturnValue(new Promise(() => undefined));

    render(<PerformanceBridgePage canManage={false} />);

    expect(screen.getByText("Loading performance data…")).toBeInTheDocument();
  });

  it("renders live role KPI definitions and target progress", async () => {
    mockedListRoles.mockResolvedValue([
      { id: 9, name: "Growth Manager", department: "Marketing" },
    ]);
    mockedGetMyTargets.mockResolvedValue([
      {
        id: 11,
        roleId: 9,
        name: "Qualified leads",
        targetValue: 40,
        actualValue: 28,
        achievementPercent: 70,
        evidenceAvailable: true,
        period: "2026-08",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        evidenceRef: "campaign:CMP-2401",
      },
    ]);
    mockedGetRoleKpis.mockResolvedValue([
      { id: 1, name: "Lead quality", unit: "score", weight: 50 },
    ]);
    mockedGetRoleTargetTemplates.mockResolvedValue([
      { id: 2, roleId: 9, name: "Qualified leads", targetValue: 40, frequency: "monthly" },
    ]);

    render(<PerformanceBridgePage canManage />);

    await waitFor(() => expect(screen.getByText("Lead quality")).toBeInTheDocument());
    expect(screen.getByText("Qualified leads")).toBeInTheDocument();
    expect(screen.getByText("70% achieved")).toBeInTheDocument();
    expect(screen.getByText("Period: 2026-08")).toBeInTheDocument();
    expect(screen.getByText("Evidence: campaign:CMP-2401")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage role targets" })).toBeInTheDocument();
  });

  it("submits Marketing evidence through the existing target-report endpoint", async () => {
    mockedListRoles.mockResolvedValue([{ id: 9, name: "Growth Manager" }]);
    mockedGetMyTargets.mockResolvedValue([
      {
        id: 11,
        roleId: 9,
        name: "Qualified leads",
        targetValue: 40,
        actualValue: 28,
        achievementPercent: 70,
        evidenceAvailable: false,
      },
    ]);
    mockedGetRoleKpis.mockResolvedValue([]);
    mockedGetRoleTargetTemplates.mockResolvedValue([]);
    mockedCreateTargetReport.mockResolvedValue({ status: 201, data: { id: 12 } });

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText("Qualified leads")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Evidence summary for Qualified leads"), {
      target: { value: "Campaign generated 28 qualified leads." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit evidence for Qualified leads" }));

    await waitFor(() =>
      expect(mockedCreateTargetReport).toHaveBeenCalledWith({
        employee_target_id: 11,
        summary: "Campaign generated 28 qualified leads.",
        progress_value: 28,
      }),
    );
    expect(await screen.findByText("Evidence submitted for Qualified leads.")).toBeInTheDocument();
  });

  it("shows a submission error without claiming evidence was saved", async () => {
    mockedListRoles.mockResolvedValue([{ id: 9, name: "Growth Manager" }]);
    mockedGetMyTargets.mockResolvedValue([
      { id: 11, roleId: 9, name: "Qualified leads", targetValue: 40, actualValue: 28 },
    ]);
    mockedGetRoleKpis.mockResolvedValue([]);
    mockedGetRoleTargetTemplates.mockResolvedValue([]);
    mockedCreateTargetReport.mockResolvedValue({ status: 400, error: "Evidence rejected" });

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText("Qualified leads")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Evidence summary for Qualified leads"), {
      target: { value: "Invalid report" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit evidence for Qualified leads" }));

    expect(await screen.findByText("Evidence rejected")).toBeInTheDocument();
    expect(screen.queryByText("Evidence submitted for Qualified leads.")).not.toBeInTheDocument();
  });

  it("distinguishes an empty target pack from an unavailable API", async () => {
    mockedListRoles.mockResolvedValue([{ id: 9, name: "Growth Manager" }]);
    mockedGetMyTargets.mockResolvedValue([]);
    mockedGetRoleKpis.mockResolvedValue([]);
    mockedGetRoleTargetTemplates.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText(/No target pack returned/)).toBeInTheDocument());
    expect(screen.getByText(/No employee targets are currently assigned/)).toBeInTheDocument();
  });

  it("shows API errors instead of rendering a successful empty state", async () => {
    mockedListRoles.mockRejectedValue(new Error("Backend unavailable"));
    mockedGetMyTargets.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText("Backend unavailable")).toBeInTheDocument());
    expect(screen.queryByText("No target pack returned")).not.toBeInTheDocument();
  });

  it("renders supported Revenue Execution OKRs from the backend", async () => {
    mockedListRoles.mockResolvedValue([]);
    mockedGetMyTargets.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText("Revenue Execution OKRs")).toBeInTheDocument());
    expect(screen.getByText("Improve conversion")).toBeInTheDocument();
    expect(mockedGetRevenueOkrs).toHaveBeenCalledTimes(1);
  });

  it("renders the supported Revenue Execution target summary", async () => {
    mockedListRoles.mockResolvedValue([]);
    mockedGetMyTargets.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText("3 targets in the current summary")).toBeInTheDocument());
    expect(mockedGetRevenueTargetsSummary).toHaveBeenCalledTimes(1);
  });

  it("does not expose management controls to an unauthorized user", async () => {
    mockedListRoles.mockResolvedValue([{ id: 9, name: "Growth Manager" }]);
    mockedGetMyTargets.mockResolvedValue([]);
    mockedGetRoleKpis.mockResolvedValue([]);
    mockedGetRoleTargetTemplates.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    await waitFor(() => expect(screen.getByText(/No target pack returned/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Manage role targets" })).not.toBeInTheDocument();
  });

  it("creates a Revenue Execution objective and refreshes the server-backed list", async () => {
    mockedListRoles.mockResolvedValue([]);
    mockedGetMyTargets.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Create Revenue objective" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Create Revenue objective" }));
    fireEvent.change(screen.getByLabelText("Objective title"), { target: { value: "Improve retention" } });
    fireEvent.change(screen.getByLabelText("Objective start"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Objective end"), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Save objective" }));

    await waitFor(() => expect(mockedCreateRevenueObjective).toHaveBeenCalledWith({
      title: "Improve retention",
      period_start: "2026-09-01",
      period_end: "2026-12-31",
    }));
    expect(mockedGetRevenueOkrs).toHaveBeenCalledTimes(2);
  });

  it("keeps the objective form visible when objective creation fails", async () => {
    mockedListRoles.mockResolvedValue([]);
    mockedGetMyTargets.mockResolvedValue([]);
    mockedCreateRevenueObjective.mockRejectedValue(new Error("Revenue service unavailable"));

    render(<PerformanceBridgePage canManage />);

    fireEvent.click(await screen.findByRole("button", { name: "Create Revenue objective" }));
    fireEvent.change(screen.getByLabelText("Objective title"), { target: { value: "Improve retention" } });
    fireEvent.change(screen.getByLabelText("Objective start"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Objective end"), { target: { value: "2026-09-30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save objective" }));

    expect(await screen.findByText("Revenue service unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Objective title")).toHaveValue("Improve retention");
  });
});
