import React, { useState, useEffect, useRef } from "react";
import { ReactTerminal } from "react-terminal";
import { makeRequest } from "../../api";
import "./Terminal.css";
import { DataState } from "../../context/DataContext";

const TerminalComp = () => {
  const {
    terminalOutput,
    commandPress,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();
  const [output, setOutput] = useState("");
  const terminalRef = useRef("null");

  const handleCommand = async (command, ...args) => {
    const fullCommand = [command, ...args].join(" ");
    console.log("Full Command:", fullCommand);
    try {
      const { data } = await makeRequest("/gdb_command", {
        command: fullCommand,
        name: "program",
      }, sessionId);
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
    console.log(terminalOutput);
    if (terminalOutput) {
      console.log(terminalOutput);
      defaultHandler(terminalOutput);
    }
  }, [commandPress]);

  if (sessionLoading) {
    return (
      <div className="terminal-loading">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="terminal-error">
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <p>{sessionError}</p>
          <button onClick={() => { clearSessionError(); createSession(); }}>
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="terminal-error">
        <p>No active session.</p>
        <button onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

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
