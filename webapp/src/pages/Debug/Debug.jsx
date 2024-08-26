import React, { useState, useEffect } from "react";
import "./Debug.css";
import Header from "../../components/Header/Header";
import DebugHeader from "../../components/DebugHeader/DebugHeader";
import Functions from "../../components/Functions/Functions";
import MainScreen from "../../components/MainScreen/MainScreen";
import Stack from "../../components/Stack/Stack";
import TerminalComp from "../../components/Terminal/TerminalComp";
import GdbComponents from "../../components/GdbComponents/GdbComponents";
import Breakpoint from "../../components/Breakpoint/Breakpoint";
import StackBottom from "../../components/StackBottom/StackBottom";
import FunctionsBottom from "../../components/FunctionsBottom/FunctionsBottom";

const Debug = () => {
  return (
    <div>
      <DebugHeader />
      <div className="container">
        <div className="left-part">
          <Functions />
          <FunctionsBottom />
        </div>
        <div className="middle-component">
          <div className="upper-part">
            <MainScreen />
            <TerminalComp />
          </div>
          <div className="lower-part">
            <GdbComponents />
            <Breakpoint />
          </div>
        </div>
        <div className="right-part">
          <Stack />
          <StackBottom />
        </div>
      </div>
    </div>
  );
};

export default Debug;
