import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const state = vi.hoisted(() => ({
  value: {
    refresh: false,
    infoBreakpointData: "",
    setInfoBreakpointData: vi.fn(),
    sessionId: "test-session-123",
    sessionLoading: false,
    sessionError: null,
    createSession: vi.fn(),
    clearSessionError: vi.fn(),
  },
}));

vi.mock("../../../../context/DataContext.jsx", () => ({
  DataState: () => state.value,
}));
vi.mock("../../../../api", () => ({
  makeRequest: vi.fn(),
}));

import { makeRequest } from "../../../../api";
import BreakPoints from "../BreakPoints.jsx";

describe("BreakPoints", () => {
  beforeEach(() => {
    state.value = {
      refresh: false,
      infoBreakpointData: "",
      setInfoBreakpointData: vi.fn(),
      sessionId: "test-session-123",
      sessionLoading: false,
      sessionError: null,
      createSession: vi.fn(),
      clearSessionError: vi.fn(),
    };
    makeRequest.mockReset();
  });

  test("renders breakpoint data when present", () => {
    state.value.infoBreakpointData = "1 breakpoint, keep y";
    render(<BreakPoints />);
    expect(screen.getByText("1 breakpoint, keep y")).toBeInTheDocument();
  });

  test("shows loading state while initializing", () => {
    state.value.sessionLoading = true;
    render(<BreakPoints />);
    expect(screen.getByText("Initializing debug session...")).toBeInTheDocument();
  });

  test("shows error banner and starts a new session", () => {
    state.value.sessionError = "Session failed";
    render(<BreakPoints />);
    expect(screen.getByText("Session failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start New Session"));
    expect(state.value.clearSessionError).toHaveBeenCalled();
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("shows no-session state and starts a debug session", () => {
    state.value.sessionId = null;
    render(<BreakPoints />);
    expect(screen.getByText("No active session.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start Debug Session"));
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("fetches breakpoints when refresh fires with a session", async () => {
    state.value.refresh = true;
    state.value.setInfoBreakpointData = vi.fn((v) => {
      state.value.infoBreakpointData = v;
    });
    makeRequest.mockResolvedValue({ data: { result: "bp-data" } });

    render(<BreakPoints />);

    await waitFor(() =>
      expect(makeRequest).toHaveBeenCalledWith(
        "/info_breakpoints",
        { name: "program" },
        "test-session-123"
      )
    );
    await waitFor(() =>
      expect(state.value.setInfoBreakpointData).toHaveBeenCalledWith("bp-data")
    );
  });

  test("swallows fetch errors", async () => {
    state.value.refresh = true;
    makeRequest.mockRejectedValue(new Error("boom"));
    render(<BreakPoints />);
    await waitFor(() => expect(makeRequest).toHaveBeenCalled());
  });
});
