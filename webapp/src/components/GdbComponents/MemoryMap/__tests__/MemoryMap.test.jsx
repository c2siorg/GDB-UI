import React from "react";
import { render, screen } from "@testing-library/react";
import MemoryMap from "../MemoryMap.jsx";
import axios from "axios";

// Mock DataContext
jest.mock("../../../../context/DataContext", () => ({
  DataState: () => ({
    refresh: false,
    memoryMap: null,
    setMemoryMap: jest.fn(),
  }),
}));

// Mock axios
jest.mock("axios");
axios.post = jest.fn().mockResolvedValue({
  data: { result: "mock memory data" }
});

test("renders MemoryMap component", () => {
  const { container } = render(<MemoryMap />);
  const memoryMapDiv = container.querySelector(".memoryMap");
  expect(memoryMapDiv).toBeInTheDocument();
});

test("displays dummy data when memoryMap is null", () => {
  render(<MemoryMap />);
  const memoryElements = screen.queryAllByText(/0x7fffffffe270/i);
  expect(memoryElements.length).toBeGreaterThan(0);
});

test("MemoryMap has correct div structure", () => {
  const { container } = render(<MemoryMap />);
  const memoryDiv = container.querySelector("div .memoryMap");
  expect(memoryDiv).toBeTruthy();
});

test("MemoryMap renders without crashing", () => {
  const { container } = render(<MemoryMap />);
  expect(container).toBeTruthy();
});
