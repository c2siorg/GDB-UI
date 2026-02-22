import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Debug from "./pages/Debug/Debug";
import Threads from "./components/GdbComponents/Threads/Threads";
import LocalVariable from "./components/GdbComponents/LocalVariable/LocalVariable";
import Context from "./components/GdbComponents/Context/Context";
import MemoryMap from "./components/GdbComponents/MemoryMap/MemoryMap";
import BreakPoints from "./components/GdbComponents/BreakPoints/BreakPoints";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";

const App = () => {
  return (
    <div>
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to="/debug" replace />} />
        <Route path="debug" element={<Debug />}>
          <Route path="threads" element={<Threads />} />
          <Route path="localVariable" element={<LocalVariable />} />
          <Route path="context" element={<Context />} />
          <Route path="memoryMap" element={<MemoryMap />} />
          <Route path="breakPoints" element={<BreakPoints />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
