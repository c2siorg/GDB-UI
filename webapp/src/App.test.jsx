import React from "react";
import { render, screen } from "./test-utils";
import App from "./App.jsx";

test("renders Footer component", () => {
  render(<App />);
  expect(
    screen.getByText(/Designed & Built with 💖 by Shubh Mehta/i)
  ).toBeInTheDocument();
});

test("renders Threads component within Debug route", () => {
  render(<App />, { route: "/debug/threads" });
  const threadsComponent = screen.getByText(/Threads/i);
  expect(threadsComponent).toBeInTheDocument();
});

test("renders LocalVariable component within Debug route", () => {
  render(<App />, { route: "/debug/localVariable" });
  const localVariableComponent = screen.getByText(/Local Variable/i);
  expect(localVariableComponent).toBeInTheDocument();
});

test("renders Context component within Debug route", () => {
  render(<App />, { route: "/debug/context" });
  const contextComponent = screen.getByText(/Context/i);
  expect(contextComponent).toBeInTheDocument();
});

test("renders MemoryMap component within Debug route", () => {
  render(<App />, { route: "/debug/memoryMap" });
  const memoryMapComponent = screen.getByText(/Memory Map/i);
  expect(memoryMapComponent).toBeInTheDocument();
});

test("renders BreakPoints component within Debug route", () => {
  render(<App />, { route: "/debug/breakPoints" });
  const breakpointsComponent = screen.getByText(/Break Points/i);
  expect(breakpointsComponent).toBeInTheDocument();
});
