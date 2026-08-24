import { renderHook, act, waitFor } from "@testing-library/react";
import { useSession } from "../useSession";
import { vi, beforeEach, test, expect } from "vitest";

const mockPost = vi.fn();
vi.mock("axios", () => ({ default: { post: (...args) => mockPost(...args) } }));

const mockSetSessionIdForApi = vi.fn();
vi.mock("../../api", () => ({ setSessionIdForApi: (...args) => mockSetSessionIdForApi(...args) }));

const SESSION = { data: { session_id: "sid-1", ws_token: "tok-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockPost.mockReset();
  mockSetSessionIdForApi.mockReset();
});

test("creates a session on mount and exposes it", async () => {
  mockPost.mockResolvedValue(SESSION);

  const { result } = renderHook(() => useSession());

  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));
  expect(result.current.wsToken).toBe("tok-1");
  expect(result.current.sessionLoading).toBe(false);
  expect(mockPost).toHaveBeenCalledWith(expect.stringContaining("/create_session"));
  expect(mockSetSessionIdForApi).toHaveBeenCalledWith("sid-1");
});

test("sets capacity message on 503", async () => {
  mockPost.mockRejectedValue({ response: { status: 503 } });

  const { result } = renderHook(() => useSession());

  await waitFor(() => expect(result.current.sessionError).toMatch(/Server capacity/));
  expect(result.current.sessionId).toBeNull();
  expect(mockSetSessionIdForApi).toHaveBeenCalledWith(null);
});

test("sets rate-limit message on 429", async () => {
  mockPost.mockRejectedValue({ response: { status: 429 } });

  const { result } = renderHook(() => useSession());

  await waitFor(() => expect(result.current.sessionError).toMatch(/Rate limited/));
});

test("falls back to the error message for other failures", async () => {
  mockPost.mockRejectedValue(new Error("Network down"));

  const { result } = renderHook(() => useSession());

  await waitFor(() => expect(result.current.sessionError).toBe("Network down"));
});

test("ends the session and clears state when it is current", async () => {
  mockPost.mockResolvedValue(SESSION);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));
  mockPost.mockClear();

  await act(async () => {
    await result.current.endSession("sid-1");
  });

  expect(mockPost).toHaveBeenCalledWith(expect.stringContaining("/end_session"), { session_id: "sid-1" });
  expect(result.current.sessionId).toBeNull();
  expect(mockSetSessionIdForApi).toHaveBeenCalledWith(null);
});

test("does not call the backend when ending a null session", async () => {
  mockPost.mockResolvedValue(SESSION);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));
  mockPost.mockClear();

  await act(async () => {
    await result.current.endSession(null);
  });

  expect(mockPost).not.toHaveBeenCalled();
});

test("clears session state for a 404 session error", async () => {
  mockPost.mockResolvedValue(SESSION);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));

  let handled;
  act(() => {
    handled = result.current.handleSessionError({ response: { status: 404 } });
  });

  expect(handled).toBe(true);
  expect(result.current.sessionError).toMatch(/Session expired/);
  expect(result.current.sessionId).toBeNull();
});

test("returns false for non-404 errors", async () => {
  mockPost.mockResolvedValue(SESSION);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));

  expect(result.current.handleSessionError({ response: { status: 500 } })).toBe(false);
});

test("clearSessionError resets the error", async () => {
  mockPost.mockRejectedValue({ response: { status: 503 } });
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionError).toBeTruthy());

  act(() => result.current.clearSessionError());

  expect(result.current.sessionError).toBeNull();
});

test("ends the session on unmount if one is active", async () => {
  mockPost.mockResolvedValue(SESSION);
  const { result, unmount } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.sessionId).toBe("sid-1"));
  mockPost.mockClear();

  unmount();

  await waitFor(() => expect(mockPost).toHaveBeenCalledWith(expect.stringContaining("/end_session"), { session_id: "sid-1" }));
});
