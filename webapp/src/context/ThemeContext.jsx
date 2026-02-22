import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem("gdbui-mode");
        return saved === "light" ? "light" : "dark";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-mode", mode);
        localStorage.setItem("gdbui-mode", mode);
    }, [mode]);

    const toggleMode = () => {
        setMode((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const isDark = mode === "dark";

    return (
        <ThemeContext.Provider value={{ mode, isDark, toggleMode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
