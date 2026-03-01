import React from "react";
import { render, screen } from "../../../../test-utils";
import Threads from "../Threads";

describe("Threads", () => {
    test("renders thread list with headings", () => {
        render(<Threads />);
        expect(screen.getByText("func")).toBeInTheDocument();
        expect(screen.getByText("file")).toBeInTheDocument();

        const threadItems = screen.getAllByText("main");
        expect(threadItems.length).toBeGreaterThan(0);
    });
});
