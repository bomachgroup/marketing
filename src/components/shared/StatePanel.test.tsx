import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "./StatePanel";

describe("ErrorState", () => {
  it("renders as a non-blocking alert with a retry action", () => {
    const onRetry = vi.fn();

    render(<ErrorState message="The backend is unavailable." onRetry={onRetry} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Some data is temporarily unavailable");
    expect(alert).toHaveClass("fixed", "bottom-4");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
