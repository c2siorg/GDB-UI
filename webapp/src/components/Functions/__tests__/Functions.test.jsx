import React from "react";
import { render, screen } from "@testing-library/react";
import Functions from "../Functions.jsx"; // Adjust the import path as per your project structure

test("renders Functions component with correct heading and function names", () => {
  render(<Functions />);

  // Assert the presence of the heading
  const headingElement = screen.getByText(/Functions/i);
  expect(headingElement).toBeInTheDocument();
});
