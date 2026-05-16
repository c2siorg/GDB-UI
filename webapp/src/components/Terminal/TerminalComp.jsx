import React, { useState, useEffect, useRef } from "react";
import { ReactTerminal } from "react-terminal";
import axios from "axios";
import "./Terminal.css";
import { DataState } from "../../context/DataContext";

const TerminalComp = () => {
  const { terminalOutput, commandPress } = DataState();
  const [output, setOutput] = useState("");
  const terminalRef = useRef("null");

  const executeCommand = async (fullCommand, signal) => {
    console.log("Full Command:", fullCommand);
    try {
      const { data } = await axios.post(
        "http://127.0.0.1:10000/gdb_command",
        {
          command: fullCommand,
          name: "program",
        },
        signal ? { signal } : undefined
      );
      return data["result"];
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return null;
      }
      return "Error executing command";
    }
  };

  const handleCommand = async (command, ...args) => {
    const fullCommand = [command, ...args].join(" ");
    return executeCommand(fullCommand);
  };

  const defaultHandler = async (command, ...args) => {
    const result = await handleCommand(command, ...args);
    setOutput(result);
    return result;
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const runTerminalCommand = async () => {
      if (!terminalOutput) return;
      const result = await executeCommand(terminalOutput, signal);
      if (!signal.aborted && result !== null) {
        setOutput(result);
      }
    };

    console.log(terminalOutput);
    if (terminalOutput) console.log(terminalOutput);
    runTerminalCommand();

    return () => {
      controller.abort();
    };
  }, [commandPress]);

  return (
    <div className="terminal">
      <ReactTerminal
        ref={terminalRef}
        themes={{
          "my-custom-theme": {
            themeBGColor: "#000",
            themeToolbarColor: "#000",
            themeColor: "#00FF00",
            themePromptColor: "#a917a8",
          },
        }}
        theme="my-custom-theme"
        defaultHandler={defaultHandler}
      />
    </div>
  );
};

export default TerminalComp;
