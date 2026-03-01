import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider, DataContext } from "./context/DataContext";
import { TerminalContextProvider } from "react-terminal";

const AllTheProviders = ({ children, route = "/", dataContext = {}, theme = "dark" }) => {
    const defaultDataContext = {
        refresh: false,
        setRefresh: vi.fn(),
        stack: [],
        setStack: vi.fn(),
        functions: [],
        setFunctions: vi.fn(),
        infoBreakpointData: "",
        setInfoBreakpointData: vi.fn(),
        memoryMap: "",
        setMemoryMap: vi.fn(),
        isDarkMode: "dark",
        setDarkMode: vi.fn(),
        dark: false,
        setDark: vi.fn(),
        terminalOutput: "",
        setCommandPress: vi.fn(),
        commandPress: true,
        setTerminalOutput: vi.fn(),
    };

    // We need to mock localStorage for the ThemeProvider
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        try {
            localStorage.setItem("gdbui-mode", theme);
        } catch (e) {
            // Ignore
        }
    }

    return (
        <MemoryRouter initialEntries={[route]}>
            <ThemeProvider key={theme}>
                <DataContext.Provider value={{ ...defaultDataContext, ...dataContext }}>
                    <TerminalContextProvider>
                        {children}
                    </TerminalContextProvider>
                </DataContext.Provider>
            </ThemeProvider>
        </MemoryRouter>
    );
};

const customRender = (ui, { route, dataContext, theme, ...options } = {}) =>
    render(ui, {
        wrapper: (props) => <AllTheProviders {...props} route={route} dataContext={dataContext} theme={theme} />,
        ...options
    });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
export { TerminalContextProvider };
