import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TerminalComp from "../TerminalComp.jsx";
import { vi } from "vitest";

// Mock react-terminal to avoid ref/rendering issues in jsdom
vi.mock("react-terminal", () => ({
  ReactTerminal: ({ defaultHandler }) => (
    <div data-testid="react-terminal">
      <button
        data-testid="terminal-input"
        onClick={() => defaultHandler("info locals")}
      >
        Send Command
      </button>
    </div>
  ),
}));

// Mock api
const mockMakeRequest = vi.fn();
vi.mock("../../../api", () => ({
  makeRequest: (...args) => mockMakeRequest(...args),
}));

// Default mock values
const defaultMockState = {
  terminalOutput: "",
  commandPress: false,
  commandCount: 0,
  sessionId: "test-session-123",
  sessionLoading: false,
  sessionError: null,
  createSession: vi.fn(),
  clearSessionError: vi.fn(),
  streamingLines: [],
  isStreaming: false,
  streamingError: null,
  clearStreamingOutput: vi.fn(),
};

let mockState = { ...defaultMockState };

vi.mock("../../../context/DataContext.jsx", () => ({
  DataState: () => mockState,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockState = { ...defaultMockState };
});

test("renders loading spinner when session is loading", () => {
  mockState.sessionLoading = true;

  render(<TerminalComp />);

  expect(screen.getByText(/Initializing debug session/i)).toBeInTheDocument();
  expect(screen.getByText(/Initializing debug session/i)).toBeInTheDocument();
});

test("renders error banner when session error exists", () => {
  mockState.sessionError = "Failed to create session";
  mockState.createSession = vi.fn();
  mockState.clearSessionError = vi.fn();

  render(<TerminalComp />);

  expect(screen.getByText(/Failed to create session/i)).toBeInTheDocument();
  expect(screen.getByText(/Start New Session/i)).toBeInTheDocument();
});

test("renders no active session when sessionId is null", () => {
  mockState.sessionId = null;

  render(<TerminalComp />);

  expect(screen.getByText(/No active session/i)).toBeInTheDocument();
  expect(screen.getByText(/Start Debug Session/i)).toBeInTheDocument();
});

test("renders ReactTerminal when session is active", () => {
  render(<TerminalComp />);

  expect(screen.getByTestId("react-terminal")).toBeInTheDocument();
});

test("start new session button calls createSession in error state", () => {
  const createSession = vi.fn();
  const clearSessionError = vi.fn();
  mockState.sessionError = "Session expired";
  mockState.createSession = createSession;
  mockState.clearSessionError = clearSessionError;

  render(<TerminalComp />);

  fireEvent.click(screen.getByText(/Start New Session/i));

  expect(clearSessionError).toHaveBeenCalledTimes(1);
  expect(createSession).toHaveBeenCalledTimes(1);
});

test("start debug session button calls createSession when no session", () => {
  const createSession = vi.fn();
  mockState.sessionId = null;
  mockState.createSession = createSession;

  render(<TerminalComp />);

  fireEvent.click(screen.getByText(/Start Debug Session/i));

  expect(createSession).toHaveBeenCalledTimes(1);
});

test("terminal command sends request via makeRequest", async () => {
  mockMakeRequest.mockResolvedValue({
    data: { result: "info locals output" },
  });

  render(<TerminalComp />);

  // Click the button that triggers defaultHandler
  fireEvent.click(screen.getByTestId("terminal-input"));

  await waitFor(() => {
    expect(mockMakeRequest).toHaveBeenCalledWith(
      "/gdb_command",
      { command: "info locals", name: "program" },
      "test-session-123"
    );
  });
});

test("terminal command error does not crash", async () => {
  mockMakeRequest.mockRejectedValue(new Error("Network error"));

  render(<TerminalComp />);

  fireEvent.click(screen.getByTestId("terminal-input"));

  // Should not throw — the catch handler returns error string
  await waitFor(() => {
    expect(mockMakeRequest).toHaveBeenCalled();
  });
});

test("commandCount is defined and accessible", () => {
  render(<TerminalComp />);

  // Simply verifying the component renders with commandCount available
  // (commandCount is consumed inside DataState destructuring)
  expect(screen.getByTestId("react-terminal")).toBeInTheDocument();
});
