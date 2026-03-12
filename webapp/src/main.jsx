// main.jsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { TerminalContextProvider } from "react-terminal";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
