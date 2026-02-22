import React, { useState, useEffect, useRef } from "react";
import { ReactTerminal } from "react-terminal";
import axios from "axios";
import "./Terminal.css";
import { DataState } from "../../context/DataContext";
import { useTheme } from "../../context/ThemeContext";

const TerminalComp = () => {
  const { terminalOutput, commandPress } = DataState();
  const { isDark } = useTheme();
  const [output, setOutput] = useState("");
  const terminalRef = useRef(null);

  const handleCommand = async (command, ...args) => {
    const fullCommand = [command, ...args].join(" ");
    try {
      const { data } = await axios.post("http://127.0.0.1:10000/gdb_command", {
        command: fullCommand,
        name: "program",
      });
      return data["result"];
    } catch (error) {
      return "Error executing command";
    }
  };

  const defaultHandler = async (command, ...args) => {
    const result = await handleCommand(command, ...args);
    setOutput(result);
    return result;
  };

  useEffect(() => {
    if (terminalOutput) {
      defaultHandler(terminalOutput);
    }
  }, [commandPress]);

  // Terminal themes that match the UI mode
  const darkTerminal = {
    themeBGColor: "#0a0a0f",
    themeToolbarColor: "#111118",
    themeColor: "#e4e4ef",
    themePromptColor: "#00e5ff",
  };

  const lightTerminal = {
    themeBGColor: "#ffffff",
    themeToolbarColor: "#ece6db",
    themeColor: "#2d2d2d",
    themePromptColor: "#c45d3e",
  };

  return (
    <div className="terminal">
      <ReactTerminal
        ref={terminalRef}
        themes={{
          "gdb-dark": darkTerminal,
          "gdb-light": lightTerminal,
        }}
        theme={isDark ? "gdb-dark" : "gdb-light"}
        showControlButtons={false}
        defaultHandler={defaultHandler}
      />
    </div>
  );
};

export default TerminalComp;
