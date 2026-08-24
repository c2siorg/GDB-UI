import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const state = vi.hoisted(() => ({
  value: {
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
vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("../../../api", () => ({
  makeRequest: vi.fn(),
}));

import { toast } from "react-toastify";
import { makeRequest } from "../../../api";
import Breakpoint from "../Breakpoint.jsx";

describe("Breakpoint", () => {
  beforeEach(() => {
    state.value = {
      sessionId: "test-session-123",
      sessionLoading: false,
      sessionError: null,
      createSession: vi.fn(),
      clearSessionError: vi.fn(),
    };
    makeRequest.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  test("renders the add breakpoint form", () => {
    render(<Breakpoint />);
    expect(screen.getByText("Add Breakpoint")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  test("shows loading state while initializing", () => {
    state.value.sessionLoading = true;
    render(<Breakpoint />);
    expect(screen.getByText("Initializing debug session...")).toBeInTheDocument();
  });

  test("shows error banner and starts a new session", () => {
    state.value.sessionError = "Session failed";
    render(<Breakpoint />);
    expect(screen.getByText("Session failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start New Session"));
    expect(state.value.clearSessionError).toHaveBeenCalled();
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("shows no-session state and starts a debug session", () => {
    state.value.sessionId = null;
    render(<Breakpoint />);
    expect(screen.getByText("No active session.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start Debug Session"));
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("toasts an error when adding a breakpoint with no fields", () => {
    render(<Breakpoint />);
    fireEvent.click(screen.getByText("Add"));
    expect(toast.error).toHaveBeenCalledWith("Enter any of the field", {
      autoClose: 1000,
    });
    expect(makeRequest).not.toHaveBeenCalled();
  });

  test("saves a breakpoint by line and toasts success", async () => {
    makeRequest.mockResolvedValue({ data: { success: true } });
    render(<Breakpoint />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "10" } });
    fireEvent.click(screen.getByText("Add"));

    expect(makeRequest).toHaveBeenCalledWith(
      "/set_breakpoint",
      { location: "10", name: "program" },
      "test-session-123"
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Added breakpoint", {
        autoClose: 1000,
      })
    );
  });

  test("toasts an error when the breakpoint request fails", async () => {
    makeRequest.mockRejectedValue(new Error("boom"));
    render(<Breakpoint />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "main" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went Wrong", {
        autoClose: 1000,
      })
    );
  });
});
