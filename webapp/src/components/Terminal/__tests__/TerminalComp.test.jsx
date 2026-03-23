import React from "react";
import { render, screen } from "@testing-library/react";
import TerminalComp from "../TerminalComp.jsx";
import axios from "axios";

// Mock DataContext
jest.mock("../../../context/DataContext", () => ({
  DataState: () => ({
    terminalOutput: "",
    commandPress: false,
  }),
}));

// Mock axios
jest.mock("axios");
axios.post = jest.fn().mockResolvedValue({
  data: { result: "mock result" }
});

// Mock react-terminal
jest.mock("react-terminal", () => ({
  ReactTerminal: React.forwardRef(() => (
    <div data-testid="react-terminal">Terminal</div>
  )),
}));

test("renders TerminalComp component", () => {
  render(<TerminalComp />);
  const terminalElement = screen.getByTestId("react-terminal");
  expect(terminalElement).toBeInTheDocument();
});

test("TerminalComp has div with terminal class", () => {
  const { container } = render(<TerminalComp />);
  const terminalDiv = container.querySelector(".terminal");
  expect(terminalDiv).toBeInTheDocument();
});

test("TerminalComp renders correctly without crashing", () => {
  render(<TerminalComp />);
  expect(screen.getByText(/Terminal/i)).toBeInTheDocument();
});
