import React from "react";
import "./Debug.css";
import Header from "../../components/Header/Header";
import DebugHeader from "../../components/DebugHeader/DebugHeader";
import Functions from "../../components/Functions/Functions";
import MainScreen from "../../components/MainScreen/MainScreen";
import Stack from "../../components/Stack/Stack";
import TerminalComp from "../../components/Terminal/TerminalComp";
import GdbComponents from "../../components/GdbComponents/GdbComponents";
import Breakpoint from "../../components/Breakpoint/Breakpoint";

const Debug = () => {
  return (
    <div>
      <Header />
      <DebugHeader />
      <div className="container">
        <Functions />
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
        <Stack />
      </div>
    </div>
  );
};

export default Debug;
