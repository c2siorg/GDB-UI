import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../../../api", () => ({
  default: { post: vi.fn() },
  setSessionIdForApi: vi.fn(),
  onSessionExpired: vi.fn(),
  makeRequest: vi.fn(),
}));

import api from "../../../api";
import Demo from "../Demo.jsx";

// Fix the mock-mode delay to 375ms so findBy* polling stays deterministic.
vi.spyOn(Math, "random").mockReturnValue(0.5);

const submitCommand = (input, cmd) => {
  fireEvent.change(input, { target: { value: cmd } });
  fireEvent.submit(input.closest("form"));
};

describe("Demo", () => {
  beforeEach(() => {
    api.post.mockReset();
    api.post.mockResolvedValue({
      data: { success: true, session_id: "sess-1", result: "ok" },
    });
  });

  test("renders two panels in mock mode by default", async () => {
    render(<Demo />);

    expect(screen.getByText("Multi-User Session Demo")).toBeInTheDocument();
    expect(screen.getByText(/MOCK MODE/)).toBeInTheDocument();
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.getByText("Panel B")).toBeInTheDocument();

    // Both panels create a mock session without touching the backend.
    expect(await screen.findAllByText(/Mock session created:/)).toHaveLength(2);
    expect(screen.getAllByText(/Session:/)).toHaveLength(2);
    expect(api.post).not.toHaveBeenCalled();
  });

  test("submitting commands in mock mode returns simulated output", async () => {
    render(<Demo />);
    await screen.findAllByText(/Mock session created:/);
    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];

    submitCommand(input, "run");
    expect(await screen.findByText(/Starting program:/)).toBeInTheDocument();
    expect(screen.getByText("(gdb) run")).toBeInTheDocument();
  });

  test("empty command does not submit", async () => {
    render(<Demo />);
    await screen.findAllByText(/Mock session created:/);
    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];

    submitCommand(input, "   ");
    // A blank command is ignored — no input log line is appended.
    expect(screen.queryByText("(gdb) ")).not.toBeInTheDocument();
  });

  test("mock mode handles break/watch/print/info/unknown commands", async () => {
    render(<Demo />);
    await screen.findAllByText(/Mock session created:/);
    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];

    submitCommand(input, "break 10");
    expect(await screen.findByText(/Breakpoint 3 at 0x400550/)).toBeInTheDocument();

    submitCommand(input, "watch x");
    expect(
      await screen.findByText(/Hardware watchpoint 4: x/)
    ).toBeInTheDocument();

    submitCommand(input, "print val");
    expect(await screen.findByText("$1 = 42")).toBeInTheDocument();

    submitCommand(input, "info locals");
    expect(await screen.findByText(/i = 5/)).toBeInTheDocument();

    submitCommand(input, "xyzzy");
    expect(
      await screen.findByText(/No symbol table is loaded/)
    ).toBeInTheDocument();
  });

  test("toggling to live mode creates sessions via the backend", async () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.queryByText(/MOCK MODE/)).not.toBeInTheDocument();
    expect(await screen.findAllByText(/Session created: sess-1/)).toHaveLength(2);
    expect(api.post).toHaveBeenCalledWith("/create_session");
  });

  test("live mode surfaces server capacity error (503)", async () => {
    api.post.mockRejectedValue({ response: { status: 503 } });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));

    // Both panels fail, so the error renders twice.
    expect(await screen.findAllByText(/Server capacity reached/)).toHaveLength(2);
    expect(screen.getAllByText("Recreate Session").length).toBeGreaterThan(0);
  });

  test("live mode surfaces rate-limit error (429)", async () => {
    api.post.mockRejectedValue({ response: { status: 429 } });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(await screen.findAllByText(/Rate limited/)).toHaveLength(2);
  });

  test("live mode surfaces generic connection error", async () => {
    api.post.mockRejectedValue({ message: "boom" });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(await screen.findAllByText("boom")).toHaveLength(2);
  });

  test("live mode sends gdb_command and shows the result", async () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findAllByText(/Session created: sess-1/);

    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];
    submitCommand(input, "info locals");

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/gdb_command",
        expect.objectContaining({ command: "info locals" })
      )
    );
    expect(await screen.findByText("ok")).toBeInTheDocument();
  });

  test("live mode shows server error result text", async () => {
    api.post
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-1" } })
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-2" } })
      .mockResolvedValueOnce({ data: { success: false, error: "boom" } });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findAllByText(/Session created:/);

    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];
    submitCommand(input, "next");
    expect(await screen.findByText("Error: boom")).toBeInTheDocument();
  });

  test("live mode clears session on 404 response", async () => {
    api.post
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-1" } })
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-2" } })
      .mockRejectedValueOnce({ response: { status: 404 }, message: "gone" });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findAllByText(/Session created:/);

    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];
    submitCommand(input, "next");

    expect(
      await screen.findByText(
        "Session expired or not found. Please start a new debug session."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Session expired or not found. Please reset the session.")
    ).toBeInTheDocument();
  });

  test("live mode reports conflict on 409 response", async () => {
    api.post
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-1" } })
      .mockResolvedValueOnce({ data: { success: true, session_id: "sess-2" } })
      .mockRejectedValueOnce({
        response: { status: 409 },
        message: "busy",
      });
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findAllByText(/Session created:/);

    const input = screen.getAllByPlaceholderText("Enter GDB command...")[0];
    submitCommand(input, "run");

    expect(
      await screen.findByText(
        "Conflict: GDB is currently running a program or compiler is busy."
      )
    ).toBeInTheDocument();
  });

  test("live mode reset session ends the old one and creates a new one", async () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findAllByText(/Session created: sess-1/);

    fireEvent.click(screen.getAllByText("Reset Session")[0]);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/end_session",
        expect.objectContaining({ session_id: expect.any(String) })
      )
    );
  });
});
