import React from "react";
import { render, screen } from "../../../../test-utils";
import MemoryMap from "../MemoryMap";

describe("MemoryMap", () => {
    test("renders fallback data when no memoryMap is provided", () => {
        render(<MemoryMap />);
        const items = screen.getAllByText(/0x7fffffffe270/i);
        expect(items.length).toBeGreaterThan(0);
    });

    test("renders provided memoryMap string", () => {
        render(<MemoryMap />, {
            dataContext: { memoryMap: "Memory map segment 0x0000" }
        });
        expect(screen.getByText(/Memory map segment 0x0000/i)).toBeInTheDocument();
    });
});
