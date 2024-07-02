// App.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

// App.jsx

test("renders Footer component", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(
    screen.getByText(/Designed & Built with 💖 by Shubh Mehta/i)
  ).toBeInTheDocument();
});

test("renders Threads component within Debug route", () => {
  render(
    <MemoryRouter initialEntries={["/debug/threads"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Threads/i)).toBeInTheDocument();
  const threadsComponent = screen.getByText(/Threads/i);
  expect(threadsComponent).toBeInTheDocument();
  expect(threadsComponent).toHaveClass("gdb-header-content active");
});

test("renders LocalVariable component within Debug route", () => {
  render(
    <MemoryRouter initialEntries={["/debug/localVariable"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Local Variable/i)).toBeInTheDocument();
  const localVariableComponent = screen.getByText(/Local Variable/i);
  expect(localVariableComponent).toBeInTheDocument();
  expect(localVariableComponent).toHaveClass("gdb-header-content active");
});

test("renders Context component within Debug route", () => {
  render(
    <MemoryRouter initialEntries={["/debug/context"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Context/i)).toBeInTheDocument();
  const contextComponent = screen.getByText(/Context/i);
  expect(contextComponent).toBeInTheDocument();
  expect(contextComponent).toHaveClass("gdb-header-content active");
});

test("renders MemoryMap component within Debug route", () => {
  render(
    <MemoryRouter initialEntries={["/debug/memoryMap"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Memory Map/i)).toBeInTheDocument();
  const memoryMapComponent = screen.getByText(/Memory Map/i);
  expect(memoryMapComponent).toBeInTheDocument();
  expect(memoryMapComponent).toHaveClass("gdb-header-content active");
});

test("renders BreakPoints component within Debug route", () => {
  render(
    <MemoryRouter initialEntries={["/debug/breakPoints"]}>
      <App />
    </MemoryRouter>
  );
  const breakpointsComponent = screen.getByText(/Break Points/i);
  expect(breakpointsComponent).toBeInTheDocument();
  expect(breakpointsComponent).toHaveClass("gdb-header-content active");
});
