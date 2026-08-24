import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import api, { makeRequest, setSessionIdForApi, onSessionExpired } from "./api";

// A custom adapter captures the outgoing config without hitting the network.
// The response interceptor still runs on rejected responses.
const captureAdapter = () => {
  const captured = {};
  const adapter = (config) => {
    captured.config = config;
    return Promise.reject(new Error("no network"));
  };
  return { captured, adapter };
};

// Axios stringifies JSON bodies before the adapter runs.
const body = (config) => JSON.parse(config.data);

describe("api request interceptor", () => {
  beforeEach(() => {
    setSessionIdForApi(null);
  });
  afterEach(() => {
    delete api.defaults.adapter;
  });

  it("makeRequest adds session_id when sessionId is provided", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    await makeRequest("/x", { a: 1 }, "sess-1").catch(() => {});
    expect(captured.config.url).toBe("/x");
    expect(body(captured.config)).toEqual({ a: 1, session_id: "sess-1" });
  });

  it("makeRequest does not add session_id when omitted", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    await makeRequest("/x", { a: 1 }).catch(() => {});
    expect(body(captured.config)).toEqual({ a: 1 });
  });

  it("injects active session id into post bodies", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    setSessionIdForApi("active-id");
    await api.post("/y", { b: 2 }).catch(() => {});
    expect(body(captured.config)).toEqual({ b: 2, session_id: "active-id" });
  });

  it("does not override an existing session_id", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    setSessionIdForApi("active-id");
    await api.post("/y", { session_id: "already-set" }).catch(() => {});
    expect(body(captured.config).session_id).toBe("already-set");
  });

  it("leaves non-POST requests untouched", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    setSessionIdForApi("active-id");
    await api.get("/y").catch(() => {});
    expect(captured.config.data).toBeUndefined();
  });

  it("creates a data object when a POST body is missing", async () => {
    const { captured, adapter } = captureAdapter();
    api.defaults.adapter = adapter;
    setSessionIdForApi("active-id");
    await api.post("/y").catch(() => {});
    expect(body(captured.config)).toEqual({ session_id: "active-id" });
  });
});

describe("api response interceptor", () => {
  it("triggers session expiry callback on 404", async () => {
    const cb = vi.fn();
    onSessionExpired(cb);
    const adapter404 = () => Promise.reject({ response: { status: 404 } });
    const err = await api
      .post("/gone", {}, { adapter: adapter404 })
      .catch((e) => e);
    expect(err.response.status).toBe(404);
    expect(cb).toHaveBeenCalledTimes(1);
    onSessionExpired(null);
  });

  it("does not trigger callback on other statuses", async () => {
    const cb = vi.fn();
    onSessionExpired(cb);
    const adapter500 = () => Promise.reject({ response: { status: 500 } });
    const err = await api
      .post("/boom", {}, { adapter: adapter500 })
      .catch((e) => e);
    expect(err.response.status).toBe(500);
    expect(cb).not.toHaveBeenCalled();
    onSessionExpired(null);
  });
});
