import React from "react";
import { render, screen } from "@testing-library/react";
import Stack from "../Stack.jsx";

vi.mock("../../../context/DataContext.jsx", () => ({
  DataState: () => ({
    refresh: false,
    stack: [],
    setStack: vi.fn(),
    sessionId: 'test-session-123',
    sessionLoading: false,
    sessionError: null,
    createSession: vi.fn(),
    clearSessionError: vi.fn(),
  }),
}));

test("renders Stack component with stack items", () => {
  render(<Stack />);

  const stackContainer = screen.getByText(/Stack/i);
  expect(stackContainer).toBeInTheDocument();
});
