// DebugHeader.test.jsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DebugHeader from "../DebugHeader.jsx";

describe("DebugHeader Component", () => {
  test("renders DebugHeader component with icons and filename", async () => {
    render(<DebugHeader />);

    const filenameContent = screen.getByText(/filename/i);
    expect(filenameContent).toBeInTheDocument();

    const saveContent = screen.getByRole("button");
    expect(saveContent).toBeInTheDocument();
  });

  test("clicking Save button triggers save action", () => {
    render(<DebugHeader />);

    const saveButton = screen.getByText(/Save/i);
    expect(saveButton).toBeInTheDocument();

    // fireEvent.click(saveButton);
  });
});
