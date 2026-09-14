import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MultiSession from "../MultiSession.jsx";
import api from "../../../api";

vi.mock("../../../api", () => ({ default: { post: vi.fn() } }));

describe("MultiSession Component", () => {
  beforeEach(() => {
    api.post.mockResolvedValue({ data: { success: true, session_id: "test-session" } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders two independent debug panels", () => {
    render(<MultiSession />);
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.getByText("Panel B")).toBeInTheDocument();
  });

  test("creates a session for each panel on mount", async () => {
    render(<MultiSession />);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/create_session"));
    expect(api.post.mock.calls.filter(([url]) => url === "/create_session").length).toBeGreaterThanOrEqual(2);
  });

  test("logs the session id once created", async () => {
    render(<MultiSession />);
    await waitFor(() => expect(screen.getAllByText(/Session created: test-session/i).length).toBe(2));
  });
});
