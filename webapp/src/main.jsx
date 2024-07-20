// main.jsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import App from "./App";
import "./index.css";

ReactDOM.render(
  <BrowserRouter>
    <DataProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </DataProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
