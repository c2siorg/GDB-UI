import React from "react";
import { render, screen } from "@testing-library/react";
import Stack from "../Stack.jsx";

vi.mock("../../../context/DataContext.jsx", () => ({
  DataState: () => ({
    refresh: false,
    stack: [],
    setStack: vi.fn(),
  }),
}));

test("renders Stack component with stack items", () => {
  render(<Stack />);

  const stackContainer = screen.getByText(/Stack/i);
  expect(stackContainer).toBeInTheDocument();
});
