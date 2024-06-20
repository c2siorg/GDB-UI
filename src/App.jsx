import React from "react";
import { Route, Routes } from "react-router-dom";
import Debug from "./pages/Debug/Debug";

const App = () => {
  return (
    <Routes>
      <Route path="debug" element={<Debug />} />
      {/* You can add more routes here */}
    </Routes>
  );
};

export default App;
