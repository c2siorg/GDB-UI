import React from "react";
import { render, screen } from "../../../test-utils";
import MainScreen from "../MainScreen";
import { vi } from "vitest";

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
    __esModule: true,
    default: ({ theme, defaultLanguage, defaultValue }) => (
        <div data-testid="monaco-editor" data-theme={theme} data-language={defaultLanguage}>
            {defaultValue}
        </div>
    ),
    loader: {
        init: vi.fn().mockResolvedValue({
            editor: {
                defineTheme: vi.fn(),
            },
        }),
    },
}));

describe("MainScreen - Dark Mode", () => {
    test("renders Monaco Editor with correct props in dark mode", () => {
        render(<MainScreen />);
        const editor = screen.getByTestId("monaco-editor");
        expect(editor).toBeInTheDocument();
        expect(editor.getAttribute("data-theme")).toBe("obsidian");
    });
});
