import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

import Login from "../Login.jsx";

describe("Login", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  test("renders heading, subtitle and submit button", () => {
    render(<Login />);
    expect(screen.getByText("Welcome to GDB-UI")).toBeInTheDocument();
    expect(screen.getByText("Demo / No auth yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue to Debugger" })
    ).toBeInTheDocument();
  });

  test("submitting the form navigates to /debug", () => {
    render(<Login />);
    fireEvent.submit(screen.getByRole("form", { name: "Login form" }));
    expect(navigate).toHaveBeenCalledWith("/debug");
  });

  test("clicking the back button navigates to /", () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(navigate).toHaveBeenCalledWith("/");
  });
});
