import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMyTargets,
  getRoleKpis,
  getRoleTargetTemplates,
  listRoles,
} from "../../../services/api/performanceApi";
import { PerformanceBridgePage } from "./PerformanceBridgePage";

vi.mock("../../../services/api/performanceApi", () => ({
  getMyTargets: vi.fn(),
  getRoleKpis: vi.fn(),
  getRoleTargetTemplates: vi.fn(),
  listRoles: vi.fn(),
}));

const mockedListRoles = vi.mocked(listRoles);
const mockedGetRoleKpis = vi.mocked(getRoleKpis);
const mockedGetRoleTargetTemplates = vi.mocked(getRoleTargetTemplates);
const mockedGetMyTargets = vi.mocked(getMyTargets);

describe("PerformanceBridgePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
    expect(screen.getByRole("button", { name: "Manage role targets" })).toBeInTheDocument();
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

  it("labels company OKRs as unavailable from the current backend", async () => {
    mockedListRoles.mockResolvedValue([]);
    mockedGetMyTargets.mockResolvedValue([]);

    render(<PerformanceBridgePage canManage={false} />);

    expect(screen.getByText("Company OKRs unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Objectives and OKRs are not available from the current backend/)).toBeInTheDocument();
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
});
