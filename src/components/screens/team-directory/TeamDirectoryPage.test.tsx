import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "../../../context/ShellContext";
import { teamService } from "../../../services/api/teamService";
import { TeamDirectoryPage } from "./TeamDirectoryPage";

vi.mock("../../../services/api/teamService", () => ({
  teamService: {
    listEmployees: vi.fn(),
    listDepartments: vi.fn(),
    listUnits: vi.fn(),
    getEmployee: vi.fn(),
  },
}));

const mockedTeamService = vi.mocked(teamService);

describe("TeamDirectoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => cleanup());

  it("keeps usable employee data when optional department and unit endpoints are unavailable", async () => {
    mockedTeamService.listEmployees.mockResolvedValue({
      status: 200,
      data: {
        count: 1,
        items: [
          {
            id: 1,
            full_name: "Ada Lovelace",
            job_title: "Marketing analyst",
            department_name: "Marketing",
            is_active: true,
          },
        ],
      },
    });
    mockedTeamService.listDepartments.mockResolvedValue({
      status: 404,
      error: "The backend returned HTML instead of the expected JSON response (HTTP 404).",
    });
    mockedTeamService.listUnits.mockResolvedValue({
      status: 404,
      error: "The backend returned HTML instead of the expected JSON response (HTTP 404).",
    });

    render(
      <ShellProvider>
        <TeamDirectoryPage />
      </ShellProvider>,
    );

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());

    expect(screen.queryByText("Could not load data")).not.toBeInTheDocument();
    expect(screen.getByText("Total team members")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });
});
