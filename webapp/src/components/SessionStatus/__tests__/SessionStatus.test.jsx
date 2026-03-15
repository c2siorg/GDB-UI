import React from "react";
import { render, screen } from "@testing-library/react";
import SessionStatus from "../SessionStatus.jsx";

test("renders Disconnected state correctly", () => {
  render(<SessionStatus status="disconnected" sessionId={null} />);
  expect(screen.getByText("Disconnected")).toBeInTheDocument();
});

test("renders Connecting state correctly", () => {
  render(<SessionStatus status="connecting" sessionId={null} />);
  expect(screen.getByText("Connecting...")).toBeInTheDocument();
});

test("renders Connected state correctly", () => {
  render(<SessionStatus status="connected" sessionId="abc-123-xyz" />);
  expect(screen.getByText("Connected")).toBeInTheDocument();
  expect(screen.getByText("abc-123-xyz")).toBeInTheDocument();
});

test("does not show session ID when null", () => {
  render(<SessionStatus status="disconnected" sessionId={null} />);
  expect(screen.queryByText("Session ID:")).not.toBeInTheDocument();
});