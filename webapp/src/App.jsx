import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Debug from "./pages/Debug/Debug";
import Demo from "./pages/Demo/Demo";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Threads from "./components/GdbComponents/Threads/Threads";
import LocalVariable from "./components/GdbComponents/LocalVariable/LocalVariable";
import Context from "./components/GdbComponents/Context/Context";
import MemoryMap from "./components/GdbComponents/MemoryMap/MemoryMap";
import BreakPoints from "./components/GdbComponents/BreakPoints/BreakPoints";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import { DataState } from "./context/DataContext";

const App = () => {
  const { setDark, dark, isDarkMode, setDarkMode } = DataState();

  const toggleDarkMode = () => {
    setDarkMode((prev) => (prev === "dark" ? "light" : "dark"));
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
        <Route path="debug" element={<Debug />}>
          <Route path="threads" element={<Threads />} />
          <Route path="localVariable" element={<LocalVariable />} />
          <Route path="context" element={<Context />} />
          <Route path="memoryMap" element={<MemoryMap />} />
          <Route path="breakPoints" element={<BreakPoints />} />
        </Route>
        <Route path="demo" element={<Demo />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
