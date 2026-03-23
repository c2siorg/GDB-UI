import React from "react";
import { render, screen } from "@testing-library/react";
import MainScreen from "../MainScreen.jsx";

// Mock DataContext
jest.mock("../../../context/DataContext", () => ({
  DataState: () => ({
    isDarkMode: "light",
  }),
}));

// Mock Monaco Editor
jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: () => <div data-testid="monaco-editor">Editor Mock</div>,
}));

test("renders MainScreen component", () => {
  render(<MainScreen />);
  const mainScreenText = screen.getByText(/MainScreen/i);
  expect(mainScreenText).toBeInTheDocument();
});

test("renders with correct CSS class", () => {
  const { container } = render(<MainScreen />);
  const mainScreenDiv = container.querySelector(".mainScreen");
  expect(mainScreenDiv).toBeInTheDocument();
});

test("shows Editor component", () => {
  render(<MainScreen />);
  const editorElement = screen.getByTestId("monaco-editor");
  expect(editorElement).toBeInTheDocument();
});

test("MainScreen renders without crashing", () => {
  const { container } = render(<MainScreen />);
  expect(container).toBeTruthy();
});
