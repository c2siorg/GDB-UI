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

describe("MainScreen - Light Mode", () => {
    beforeEach(() => {
        const mockStorage = {
            getItem: vi.fn().mockReturnValue("light"),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
        vi.stubGlobal('localStorage', mockStorage);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("renders Monaco Editor with correct props in light mode", () => {
        render(<MainScreen />, { theme: "light" });

        const editor = screen.getByTestId("monaco-editor");
        expect(editor).toBeInTheDocument();
        expect(editor.getAttribute("data-theme")).toBe("bone");
    });
});
