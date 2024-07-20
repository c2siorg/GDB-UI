import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DebugHeader from "../DebugHeader.jsx";
import { DataContext } from "../../../context/DataContext.jsx";

describe("DebugHeader Component", () => {
  test("renders DebugHeader component with icons and filename", () => {
    render(
      <DataContext.Provider value={{ refresh: false, setRefresh: vi.fn() }}>
        <DebugHeader />
      </DataContext.Provider>
    );

    const filenameContent = screen.getByText(/filename/i);
    expect(filenameContent).toBeInTheDocument();

    const saveContent = screen.getByRole("button", { name: /save/i });
    expect(saveContent).toBeInTheDocument();
  });

  test("clicking Save button triggers save action", () => {
    const mockSetRefresh = vi.fn();

    render(
      <DataContext.Provider
        value={{ refresh: false, setRefresh: mockSetRefresh }}
      >
        <DebugHeader />
      </DataContext.Provider>
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockSetRefresh).toHaveBeenCalledWith(true);
  });

  test("clicking Save button when refresh is true shows 'Saving..'", () => {
    const mockSetRefresh = vi.fn();

    render(
      <DataContext.Provider
        value={{ refresh: true, setRefresh: mockSetRefresh }}
      >
        <DebugHeader />
      </DataContext.Provider>
    );

    const saveButton = screen.getByRole("button", { name: /saving\.\./i });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockSetRefresh).toHaveBeenCalledWith(false);
  });
});
