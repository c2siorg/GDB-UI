// main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { TerminalContextProvider } from "react-terminal";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <DataProvider>
      <TerminalContextProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </TerminalContextProvider>
    </DataProvider>
  </BrowserRouter>
);
