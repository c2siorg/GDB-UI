import React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import useSession from "../useSession";
import { DataContext } from "../../context/DataContext";

const HookHarness = () => {
  useSession();
  return null;
};

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("useSession", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    global.fetch = originalFetch;
  });

  it("creates backend session, updates connection state, and polls every 5 seconds", async () => {
    const setSessionId = vi.fn();
    const setConnectionStatus = vi.fn();

    global.fetch = vi.fn((url) => {
      if (url.endsWith("/create_session")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ session_id: "abcd1234-efgh-5678" }),
        });
      }

      if (url.endsWith("/health")) {
        return Promise.resolve({ ok: true });
      }

      return Promise.reject(new Error("Unexpected URL"));
    });

    const { unmount } = render(
      <DataContext.Provider
        value={{
          setSessionId,
          setConnectionStatus,
        }}
      >
        <HookHarness />
      </DataContext.Provider>,
    );

    expect(setConnectionStatus).toHaveBeenCalledWith("Connecting...");

    await flushMicrotasks();
    expect(setSessionId).toHaveBeenCalledWith("abcd1234-efgh-5678");
    expect(setConnectionStatus).toHaveBeenCalledWith("Connected");

    const getHealthCallCount = () =>
      global.fetch.mock.calls.filter(([url]) => url.endsWith("/health")).length;

    expect(getHealthCallCount()).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    await flushMicrotasks();
    expect(getHealthCallCount()).toBe(2);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(getHealthCallCount()).toBe(2);
  });
});
