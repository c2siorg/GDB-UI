// main.jsx
import React from "react";
import { createRoot } from "react-dom/client"; // Import createRoot
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { TerminalContextProvider } from "react-terminal";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container); // Create a root

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

