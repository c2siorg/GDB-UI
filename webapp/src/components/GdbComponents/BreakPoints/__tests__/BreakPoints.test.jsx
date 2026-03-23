import React from "react";
import { render, screen } from "@testing-library/react";
import BreakPoints from "../BreakPoints.jsx";
import axios from "axios";

// Mock DataContext
jest.mock("../../../../context/DataContext", () => ({
  DataState: () => ({
    refresh: false,
    setInfoBreakpointData: jest.fn(),
    infoBreakpointData: null,
  }),
}));

// Mock axios
jest.mock("axios");
axios.post = jest.fn().mockResolvedValue({
  data: { result: "mock breakpoint data" }
});

test("renders BreakPoints component", () => {
  const { container } = render(<BreakPoints />);
  const breakpointsDiv = container.querySelector(".breakpoints");
  expect(breakpointsDiv).toBeInTheDocument();
});

test("displays dummy breakpoint data when infoBreakpointData is null", () => {
  render(<BreakPoints />);
  const offsetElements = screen.queryAllByText(/0x2fffa36f603112ffff34/i);
  expect(offsetElements.length).toBeGreaterThan(0);
});

test("displays dummy breakpoint file path", () => {
  render(<BreakPoints />);
  const pathElement = screen.getByText(/t\.js:18/i);
  expect(pathElement).toBeInTheDocument();
});

test("BreakPoints has correct div structure", () => {
  const { container } = render(<BreakPoints />);
  const breakpointsDiv = container.querySelector("div .breakpoints");
  expect(breakpointsDiv).toBeTruthy();
});

test("BreakPoints component renders without crashing", () => {
  const { container } = render(<BreakPoints />);
  expect(container).toBeTruthy();
});
