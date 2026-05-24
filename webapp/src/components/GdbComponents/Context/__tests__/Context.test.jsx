import React from "react";
import { render, screen } from "@testing-library/react";
import Context from "../Context.jsx";

// Mock DataContext (not needed for this component but good practice)
jest.mock("../../../../context/DataContext", () => ({
  DataState: () => ({}),
}));

test("renders Context component", () => {
  const { container } = render(<Context />);
  const contextDiv = container.querySelector(".context");
  expect(contextDiv).toBeInTheDocument();
});

test("renders Context with cat /proc/maps command", () => {
  render(<Context />);
  const catElement = screen.getByText(/cat \/proc/i);
  expect(catElement).toBeInTheDocument();
});

test("renders Context with heap memory mapping", () => {
  render(<Context />);
  const heapElement = screen.getByText(/heap/i);
  expect(heapElement).toBeInTheDocument();
});

test("renders Context with memory address data", () => {
  render(<Context />);
  const memoryElements = screen.queryAllByText(/0x5555555592a/i);
  expect(memoryElements.length).toBeGreaterThan(0);
});

test("Context component renders without crashing", () => {
  const { container } = render(<Context />);
  expect(container).toBeTruthy();
});
