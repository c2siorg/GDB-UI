import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../../../../context/DataContext.jsx", async () => {
  const { createContext, useContext } = await import("react");
  const DataContext = createContext({ refresh: false });
  return {
    DataContext,
    DataState: () => useContext(DataContext),
  };
});
vi.mock("../../../../api", () => ({
  default: { post: vi.fn() },
  makeRequest: vi.fn(),
}));

import api from "../../../../api";
import { DataContext } from "../../../../context/DataContext.jsx";
import Threads from "../Threads.jsx";

const renderWithContext = (refresh) =>
  render(
    <DataContext.Provider value={{ refresh }}>
      <Threads />
    </DataContext.Provider>
  );

describe("Threads", () => {
  beforeEach(() => {
    api.post.mockReset();
    api.post.mockResolvedValue({ data: { success: true, result: "thread-1" } });
  });

  test("shows no threads when refresh has not fired", () => {
    renderWithContext(false);
    expect(screen.getByText("No active threads.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test("shows loading state while the request is in flight", () => {
    let resolvePost;
    api.post.mockReturnValue(
      new Promise((res) => {
        resolvePost = res;
      })
    );
    renderWithContext(true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    act(() => {
      resolvePost({ data: { success: true, result: "thread-1" } });
    });
  });

  test("renders fetched threads", async () => {
    renderWithContext(true);
    expect(await screen.findByText("thread-1")).toBeInTheDocument();
  });

  test("shows server error message when result is not successful", async () => {
    api.post.mockResolvedValue({ data: { success: false, error: "fetch failed" } });
    renderWithContext(true);
    expect(await screen.findByText("fetch failed")).toBeInTheDocument();
  });

  test("shows generic error when the request rejects", async () => {
    api.post.mockRejectedValue(new Error("boom"));
    renderWithContext(true);
    expect(await screen.findByText("Failed to fetch threads")).toBeInTheDocument();
  });

  test("treats a no-threads result as empty", async () => {
    api.post.mockResolvedValue({ data: { success: true, result: "No threads found" } });
    renderWithContext(true);
    expect(await screen.findByText("No active threads.")).toBeInTheDocument();
  });
});
