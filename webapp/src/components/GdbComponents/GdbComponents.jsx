import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./GdbComponents.css";

const Platform = ({ setActive, active }) => (
  <>
    <NavLink
      to="/debug/threads"
      className={`gdb-header-content ${active === "threads" ? "active" : ""}`}
      onClick={() => {
        setActive("threads");
      }}
    >
      Threads
    </NavLink>
    <NavLink
      to="/debug/localVariable"
      className={`gdb-header-content ${
        active === "localVariable" ? "active" : ""
      }`}
      onClick={() => {
        setActive("localVariable");
      }}
    >
      Local Variable
    </NavLink>
    <NavLink
      to="/debug/context"
      className={`gdb-header-content ${active === "Context" ? "active" : ""}`}
      onClick={() => {
        setActive("Context");
      }}
    >
      Context
    </NavLink>
    <NavLink
      to="/debug/memoryMap"
      className={`gdb-header-content ${active === "memoryMap" ? "active" : ""}`}
      onClick={() => {
        setActive("memoryMap");
      }}
    >
      Memory Map
    </NavLink>
    <NavLink
      to="/debug/breakPoints"
      className={`gdb-header-content ${
        active === "breakPoints" ? "active" : ""
      }`}
      onClick={() => {
        setActive("breakPoints");
      }}
    >
      Break Points
    </NavLink>
  </>
);

const GdbComponents = () => {
  const [active, setActive] = useState("");

  return (
    <div className="gdb-components">
      <div className="gdb-header">
        <Platform setActive={setActive} active={active} />
      </div>
      <div className="gdb-content">
        <Outlet />
      </div>
    </div>
  );
};

export default GdbComponents;
