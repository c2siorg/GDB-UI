import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Debug from "./pages/Debug/Debug";
import Threads from "./components/GdbComponents/Threads/Threads";
import LocalVariable from "./components/GdbComponents/LocalVariable/LocalVariable";
import Context from "./components/GdbComponents/Context/Context";
import MemoryMap from "./components/GdbComponents/MemoryMap/MemoryMap";
import BreakPoints from "./components/GdbComponents/BreakPoints/BreakPoints";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import { DataState } from "./context/DataContext";
import Home from "./pages/Home/Home";

const App = () => {
  const { setDark, dark, isDarkMode, setDarkMode } = DataState();

  const toggleDarkMode = () => {
    setDarkMode((isDarkMode) => (isDarkMode === "dark" ? "light" : "dark"));
    setDark(!dark);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode);
  }, [isDarkMode]);
  return (
    <div>
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        dark={dark}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="debug" element={<Debug />}>
          <Route path="threads" element={<Threads />} />
          <Route path="localVariable" element={<LocalVariable />} />
          <Route path="context" element={<Context />} />
          <Route path="memoryMap" element={<MemoryMap />} />
          <Route path="breakPoints" element={<BreakPoints />} />
        </Route>
        {/* You can add more routes here */}
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
