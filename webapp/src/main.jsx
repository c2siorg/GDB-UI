// main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TerminalContextProvider } from "react-terminal";
import App from "./App";
import "./themes.css";
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <ThemeProvider>
      <DataProvider>
        <TerminalContextProvider>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </TerminalContextProvider>
      </DataProvider>
    </ThemeProvider>
  </BrowserRouter>
);
