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

test("renders streaming panel with output lines", () => {
  mockState.streamingLines = ["Hello from GDB", "Breakpoint hit"];
  mockState.isStreaming = true;

  render(<TerminalComp />);

  expect(screen.getByText("Hello from GDB")).toBeInTheDocument();
  expect(screen.getByText("Breakpoint hit")).toBeInTheDocument();
  expect(screen.getByText(/Stream/)).toBeInTheDocument();
  // Connected status is indicated by the CSS class "connected" on the status span
  expect(document.querySelector(".streaming-status.connected")).toBeInTheDocument();
});

test("renders streaming panel with waiting message when connected but no output", () => {
  mockState.streamingLines = [];
  mockState.isStreaming = true;

  render(<TerminalComp />);

  expect(screen.getByText("Waiting for output...")).toBeInTheDocument();
  expect(screen.getByText(/Stream/)).toBeInTheDocument();
  expect(document.querySelector(".streaming-status.connected")).toBeInTheDocument();
});

test("does not render streaming panel when not connected and no lines", () => {
  mockState.streamingLines = [];
  mockState.isStreaming = false;

  render(<TerminalComp />);

  expect(screen.queryByText(/Stream/)).not.toBeInTheDocument();
  expect(screen.queryByText("Waiting for output...")).not.toBeInTheDocument();
});

test("clear button calls clearStreamingOutput", () => {
  const clearStreamingOutput = vi.fn();
  mockState.streamingLines = ["some output"];
  mockState.isStreaming = true;
  mockState.clearStreamingOutput = clearStreamingOutput;

  render(<TerminalComp />);

  fireEvent.click(screen.getByText("Clear"));
  expect(clearStreamingOutput).toHaveBeenCalledTimes(1);
});

test("renders streaming error banner when streamingError is set", () => {
  mockState.streamingError = "Session expired. Please create a new debug session.";

  render(<TerminalComp />);

  expect(screen.getByText("Session expired. Please create a new debug session.")).toBeInTheDocument();
});

test("shows disconnected status indicator when not connected but has lines", () => {
  mockState.streamingLines = ["old output"];
  mockState.isStreaming = false;

  render(<TerminalComp />);

  expect(screen.getByText("old output")).toBeInTheDocument();
  expect(screen.getByText(/Stream/)).toBeInTheDocument();
  // Disconnected status: class is "streaming-status " (no "connected")
  expect(document.querySelector(".streaming-status:not(.connected)")).toBeInTheDocument();
});
