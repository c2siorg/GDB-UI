import React from "react";
import { render, screen } from "../../../../test-utils";
import LocalVariable from "../LocalVariable";

describe("LocalVariable", () => {
    test("renders sample local variables", () => {
        render(<LocalVariable />);
        expect(screen.getByText(/RAD_T 0.214124123/i)).toBeInTheDocument();
        expect(screen.getByText(/angle 380 double/i)).toBeInTheDocument();
    });
});
