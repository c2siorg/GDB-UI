import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const state = vi.hoisted(() => ({
  value: {
    refresh: false,
    memoryMap: "",
    setMemoryMap: vi.fn(),
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
import MemoryMap from "../MemoryMap.jsx";

describe("MemoryMap", () => {
  beforeEach(() => {
    state.value = {
      refresh: false,
      memoryMap: "",
      setMemoryMap: vi.fn(),
      sessionId: "test-session-123",
      sessionLoading: false,
      sessionError: null,
      createSession: vi.fn(),
      clearSessionError: vi.fn(),
    };
    makeRequest.mockReset();
  });

  test("falls back to static sample data when memoryMap is empty", () => {
    render(<MemoryMap />);
    // The 8 sample rows share the same address prefix.
    expect(screen.getAllByText(/0x7fffffffe270/)).toHaveLength(8);
  });

  test("renders the fetched memory map when present", () => {
    state.value.memoryMap = "0x00400000: 0x00 0x01";
    render(<MemoryMap />);
    expect(screen.getByText("0x00400000: 0x00 0x01")).toBeInTheDocument();
  });

  test("shows loading state while initializing", () => {
    state.value.sessionLoading = true;
    render(<MemoryMap />);
    expect(screen.getByText("Initializing debug session...")).toBeInTheDocument();
  });

  test("shows error banner and starts a new session", () => {
    state.value.sessionError = "Session failed";
    render(<MemoryMap />);
    expect(screen.getByText("Session failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start New Session"));
    expect(state.value.clearSessionError).toHaveBeenCalled();
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("shows no-session state and starts a debug session", () => {
    state.value.sessionId = null;
    render(<MemoryMap />);
    expect(screen.getByText("No active session.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start Debug Session"));
    expect(state.value.createSession).toHaveBeenCalled();
  });

  test("fetches memory map when refresh fires with a session", async () => {
    state.value.refresh = true;
    state.value.setMemoryMap = vi.fn((v) => {
      state.value.memoryMap = v;
    });
    makeRequest.mockResolvedValue({ data: { result: "mem-data" } });

    render(<MemoryMap />);

    await waitFor(() =>
      expect(makeRequest).toHaveBeenCalledWith(
        "/memory_map",
        { name: "program" },
        "test-session-123"
      )
    );
    await waitFor(() =>
      expect(state.value.setMemoryMap).toHaveBeenCalledWith("mem-data")
    );
  });

  test("swallows fetch errors", async () => {
    state.value.refresh = true;
    makeRequest.mockRejectedValue(new Error("boom"));
    render(<MemoryMap />);
    await waitFor(() => expect(makeRequest).toHaveBeenCalled());
  });
});
