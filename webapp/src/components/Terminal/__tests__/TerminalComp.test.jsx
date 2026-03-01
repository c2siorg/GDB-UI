import React from "react";
import { render, screen, waitFor, fireEvent } from "../../../test-utils";
import TerminalComp from "../TerminalComp";
import { vi } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Mock react-terminal
vi.mock("react-terminal", () => ({
    ReactTerminal: React.forwardRef(({ theme, defaultHandler }, ref) => (
        <div data-testid="react-terminal" data-theme={theme}>
            <input
                data-testid="terminal-input"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        defaultHandler(e.target.value);
                    }
                }}
            />
        </div>
    )),
    TerminalContextProvider: ({ children }) => <div>{children}</div>
}));

describe("TerminalComp", () => {
    test("renders Terminal with correct theme", () => {
        render(<TerminalComp />);
        const terminal = screen.getByTestId("react-terminal");
        expect(terminal).toBeInTheDocument();
        expect(terminal.getAttribute("data-theme")).toBe("gdb-dark");
    });

    test("handles command execution", async () => {
        axios.post.mockResolvedValue({ data: { result: "Success" } });
        render(<TerminalComp />);

        const input = screen.getByTestId("terminal-input");
        fireEvent.change(input, { target: { value: 'run' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("http://127.0.0.1:10000/gdb_command", {
                command: "run",
                name: "program",
            });
        });
    });
});
