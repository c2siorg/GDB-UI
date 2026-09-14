import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DebugHeader from "../DebugHeader.jsx";
import { DataContext } from "../../../context/DataContext.jsx";

describe("DebugHeader Component", () => {
  test("renders DebugHeader component with icons and filename", () => {
    render(
      <DataContext.Provider value={{ filename: "program.cpp", compiling: false, compileCode: vi.fn() }}>
        <DebugHeader />
      </DataContext.Provider>
    );

    const filenameContent = screen.getByText(/program.cpp/i);
    expect(filenameContent).toBeInTheDocument();

    const saveContent = screen.getByRole("button", { name: /save/i });
    expect(saveContent).toBeInTheDocument();
  });

  test("clicking Save button triggers save action", async () => {
    const mockCompileCode = vi.fn().mockResolvedValue({});

    render(
      <DataContext.Provider
        value={{ filename: "program.cpp", compiling: false, compileCode: mockCompileCode }}
      >
        <DebugHeader />
      </DataContext.Provider>
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockCompileCode).toHaveBeenCalled();
  });

  test("clicking Save button when compiling is true shows 'Compiling...'", () => {
    const mockCompileCode = vi.fn();

    render(
      <DataContext.Provider
        value={{ filename: "program.cpp", compiling: true, compileCode: mockCompileCode }}
      >
        <DebugHeader />
      </DataContext.Provider>
    );

    const saveButton = screen.getByRole("button", { name: /compiling\.\.\./i });
    expect(saveButton).toBeInTheDocument();
  });
});
