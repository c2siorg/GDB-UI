import React from "react";
import { render, screen } from "@testing-library/react";
import StackBottom from "../StackBottom.jsx";

test("renders StackBottom component with headings", () => {
  render(<StackBottom />);

  const heading = screen.getByText(/Registors/i);
  expect(heading).toBeInTheDocument();

  const parts = ["func", "file", "addr", "args"];
  parts.forEach((part) => {
    const partElement = screen.getByText(part);
    expect(partElement).toBeInTheDocument();
  });
});
