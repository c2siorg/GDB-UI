import React from "react";
import { render, screen } from "@testing-library/react";
import LocalVariable from "../LocalVariable.jsx";

// Mock DataContext (not needed for this component but good practice)
jest.mock("../../../../context/DataContext", () => ({
  DataState: () => ({}),
}));

test("renders LocalVariable component", () => {
  const { container } = render(<LocalVariable />);
  const localVariableDiv = container.querySelector(".localVariable");
  expect(localVariableDiv).toBeInTheDocument();
});

test("renders LocalVariable with RAD_T variable", () => {
  render(<LocalVariable />);
  const radTElement = screen.getByText(/RAD_T/i);
  expect(radTElement).toBeInTheDocument();
});

test("renders LocalVariable with angle variable", () => {
  render(<LocalVariable />);
  const angleElement = screen.getByText(/angle 380 double/i);
  expect(angleElement).toBeInTheDocument();
});

test("renders LocalVariable with shared_ptr variables", () => {
  render(<LocalVariable />);
  const sharedPtrElements = screen.queryAllByText(/globalshred/i);
  expect(sharedPtrElements.length).toBeGreaterThan(0);
});

test("LocalVariable component renders without crashing", () => {
  const { container } = render(<LocalVariable />);
  expect(container).toBeTruthy();
});
