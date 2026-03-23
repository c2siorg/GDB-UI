import React from "react";
import { render, screen } from "@testing-library/react";
import Threads from "../Threads.jsx";

// Mock DataContext
jest.mock("../../../../context/DataContext", () => ({
  DataState: () => ({}),
}));

test("renders Threads component", () => {
  const { container } = render(<Threads />);
  const threadsDiv = container.querySelector(".threads");
  expect(threadsDiv).toBeInTheDocument();
});

test("renders Threads component part1 with func text", () => {
  render(<Threads />);
  const funcText = screen.getByText(/func/i);
  expect(funcText).toBeInTheDocument();
});

test("renders Threads component part2 with file text", () => {
  render(<Threads />);
  const fileText = screen.getByText(/file/i);
  expect(fileText).toBeInTheDocument();
});

test("Threads component has threads-component class", () => {
  const { container } = render(<Threads />);
  const threadsComponent = container.querySelector(".threads-component");
  expect(threadsComponent).toBeInTheDocument();
});

test("Threads renders without crashing", () => {
  const { container } = render(<Threads />);
  expect(container).toBeTruthy();
});
