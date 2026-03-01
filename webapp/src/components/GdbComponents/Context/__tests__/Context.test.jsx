import React from "react";
import { render, screen } from "../../../../test-utils";
import Context from "../Context";

describe("Context", () => {
    test("renders static context information", () => {
        render(<Context />);
        expect(screen.getByText(/cat \/proc\/24963\/maps/i)).toBeInTheDocument();
    });
});
