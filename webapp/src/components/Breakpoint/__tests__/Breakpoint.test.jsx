import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Breakpoint from "../Breakpoint.jsx";

// Breakpoint
test("renders Breakpoint component with basic structure", () => {
  render(<Breakpoint />);

  const addBreakpointElement = screen.getByText(/Add Breakpoint/i);
  expect(addBreakpointElement).toBeInTheDocument();

  const watchLabel = screen.getByText(/Watch variable/i);
  expect(watchLabel).toBeInTheDocument();

  const lineInputs = screen.getAllByRole("textbox");
  expect(lineInputs).toHaveLength(3);
});

test("renders Breakpoint component and checks about text Line", async () => {
  render(<Breakpoint />);
  const lineLabel = screen.getByText(/Line/i);
  expect(lineLabel).toBeInTheDocument();
});

test("typing in Line input updates the value correctly", () => {
  render(<Breakpoint />);

  const lineInput = screen.getAllByRole("textbox");
  fireEvent.change(lineInput[0], { target: { value: "123" } });

  expect(lineInput[0]).toHaveValue("123");
});

test("typing in Watch variable input updates the value correctly", () => {
  render(<Breakpoint />);

  const textInputs = screen.getAllByRole("textbox");
  const watchInput = textInputs[2];
  fireEvent.change(watchInput, { target: { value: "myVar" } });

  expect(watchInput).toHaveValue("myVar");
});
