import { renderHook, act } from "@testing-library/react";
import { useStreamingOutput } from "../useStreamingOutput";
import { vi, beforeEach, test, expect } from "vitest";

const mockOn = vi.fn();
const mockDisconnect = vi.fn();
const mockIo = vi.fn(() => ({
  on: mockOn,
  disconnect: mockDisconnect,
}));
vi.mock("socket.io-client", () => ({ io: (...args) => mockIo(...args) }));

let handlers;
beforeEach(() => {
  vi.clearAllMocks();
  handlers = {};
  mockOn.mockImplementation((event, cb) => {
    handlers[event] = cb;
  });
});

const emit = (event, payload) => {
  act(() => handlers[event](payload));
};

test("connects to the debug namespace with session credentials", () => {
  renderHook(() => useStreamingOutput("s1", "t1"));

  expect(mockIo).toHaveBeenCalledWith(
    expect.stringContaining("/ws/debug"),
    expect.objectContaining({ query: { session_id: "s1", ws_token: "t1" } })
  );
});

test("skips connecting when session or token is missing", () => {
  renderHook(() => useStreamingOutput(null, "t1"));
  renderHook(() => useStreamingOutput("s1", null));

  expect(mockIo).not.toHaveBeenCalled();
});

test("marks the stream connected on the connect event", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("connect");

  expect(result.current.isConnected).toBe(true);
});

test("appends string gdb_output lines", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("gdb_output", { payload: "Breakpoint 1 hit" });
  emit("gdb_output", { payload: "next line" });

  expect(result.current.lines).toEqual(["Breakpoint 1 hit", "next line"]);
});

test("stringifies object payloads", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("gdb_output", { payload: { token: 42 } });

  expect(result.current.lines).toEqual([JSON.stringify({ token: 42 })]);
});

test("ignores empty or null payloads", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("gdb_output", { payload: null });
  emit("gdb_output", { payload: "   " });

  expect(result.current.lines).toEqual([]);
});

test("caps the line buffer at 1000 entries", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  act(() => {
    for (let i = 0; i < 1005; i++) {
      handlers.gdb_output({ payload: `line-${i}` });
    }
  });

  expect(result.current.lines).toHaveLength(1000);
  expect(result.current.lines[0]).toBe("line-5");
  expect(result.current.lines[999]).toBe("line-1004");
});

test("reports session expiry", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("session_expired");

  expect(result.current.isConnected).toBe(false);
  expect(result.current.error).toMatch(/Session expired/);
});

test("reports connect errors", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("connect_error");

  expect(result.current.isConnected).toBe(false);
  expect(result.current.error).toMatch(/Failed to connect/);
});

test("marks the stream disconnected on the disconnect event", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));

  emit("connect");
  emit("disconnect");

  expect(result.current.isConnected).toBe(false);
});

test("clearOutput empties lines and error", () => {
  const { result } = renderHook(() => useStreamingOutput("s1", "t1"));
  emit("gdb_output", { payload: "some output" });
  emit("session_expired");

  act(() => result.current.clearOutput());

  expect(result.current.lines).toEqual([]);
  expect(result.current.error).toBeNull();
});

test("disconnects the socket on unmount", () => {
  const { unmount } = renderHook(() => useStreamingOutput("s1", "t1"));

  unmount();

  expect(mockDisconnect).toHaveBeenCalled();
});
