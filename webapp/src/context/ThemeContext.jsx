import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext({
    mode: "dark",
    isDark: true,
    toggleMode: () => { },
    setMode: () => { }
});

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        try {
            const saved = localStorage.getItem("gdbui-mode");
            return saved === "light" ? "light" : "dark";
        } catch (e) {
            return "dark";
        }
    });

    useEffect(() => {
        try {
            const root = document.documentElement;
            root.setAttribute("data-mode", mode);
            localStorage.setItem("gdbui-mode", mode);
        } catch (e) {
            // Silently fail in environments without localStorage/DOM
        }
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
