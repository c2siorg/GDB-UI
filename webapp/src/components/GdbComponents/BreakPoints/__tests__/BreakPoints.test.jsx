import React from "react";
import { render, screen } from "../../../../test-utils";
import BreakPoints from "../BreakPoints";
import { vi } from "vitest";
import axios from "axios";

vi.mock("axios");

describe("BreakPoints", () => {
    test("renders fallback data when no infoBreakpointData is provided", () => {
        render(<BreakPoints />);
        const items = screen.getAllByText(/0x2fffa36f603112ffff34/i);
        expect(items.length).toBeGreaterThan(0);
    });

    test("renders provided infoBreakpointData", () => {
        render(<BreakPoints />, {
            dataContext: { infoBreakpointData: "Breakpoint 1 at 0x1234" }
        });
        expect(screen.getByText(/Breakpoint 1 at 0x1234/i)).toBeInTheDocument();
    });
});
