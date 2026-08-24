import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const state = vi.hoisted(() => ({
  value: {
    refresh: false,
    stack: [],
    setStack: vi.fn(),
    sessionId: "test-session-123",
    sessionLoading: false,
    sessionError: null,
    createSession: vi.fn(),
    clearSessionError: vi.fn(),
  },
}));

vi.mock("../../../context/DataContext.jsx", () => ({
  DataState: () => state.value,
}));
vi.mock("../../../api", () => ({
  makeRequest: vi.fn(),
}));

import { makeRequest } from "../../../api";
import Stack from "../Stack.jsx";

describe("Stack", () => {
  beforeEach(() => {
    state.value = {
      refresh: false,
      stack: [],
      setStack: vi.fn(),
      sessionId: "test-session-123",
      sessionLoading: false,
      sessionError: null,
      createSession: vi.fn(),
      clearSessionError: vi.fn(),
    };
    makeRequest.mockReset();
  });

  test("renders Stack heading with active session", () => {
    render(<Stack />);
    expect(screen.getByText(/Stack/i)).toBeInTheDocument();
  });

  test("shows loading state while initializing", () => {
    state.value.sessionLoading = true;
    render(<Stack />);
    expect(screen.getByText("Initializing debug session...")).toBeInTheDocument();
  });

  test("shows error banner and starts a new session", () => {
    state.value.sessionError = "Session failed";
    render(<Stack />);
    expect(screen.getByText("Session failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start New Session"));
    expect(state.value.clearSessionError).toHaveBeenCalled();
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("shows no-session state and starts a debug session", () => {
    state.value.sessionId = null;
    render(<Stack />);
    expect(screen.getByText("No active session.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start Debug Session"));
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("fetches stack trace when refresh fires with a session", async () => {
    state.value.refresh = true;
    state.value.setStack = vi.fn((v) => {
      state.value.stack = v;
    });
    makeRequest.mockResolvedValue({ data: { result: "stack-data" } });

    render(<Stack />);

    await waitFor(() =>
      expect(makeRequest).toHaveBeenCalledWith(
        "/stack_trace",
        { name: "program" },
        "test-session-123"
      )
    );
    await waitFor(() =>
      expect(state.value.setStack).toHaveBeenCalledWith("stack-data")
    );
  });

  test("swallows fetch errors", async () => {
    state.value.refresh = true;
    makeRequest.mockRejectedValue(new Error("boom"));
    render(<Stack />);
    await waitFor(() => expect(makeRequest).toHaveBeenCalled());
  });
});
