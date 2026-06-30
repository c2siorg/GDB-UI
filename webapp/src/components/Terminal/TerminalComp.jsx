import React, { useState, useEffect, useRef } from "react";
import { ReactTerminal } from "react-terminal";
import { makeRequest } from "../../api";
import "./Terminal.css";
import { DataState } from "../../context/DataContext";

const TerminalComp = () => {
  const {
    terminalOutput,
    commandPress,
    commandCount,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError,
    streamingLines,
    isStreaming,
    streamingError,
    clearStreamingOutput,
  } = DataState();
  const [output, setOutput] = useState("");
  const terminalRef = useRef(null);
  const streamingEndRef = useRef(null);

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
  }, [commandCount]);

  useEffect(() => {
    if (streamingEndRef.current) {
      streamingEndRef.current.scrollTop = streamingEndRef.current.scrollHeight;
    }
  }, [streamingLines]);

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
      {streamingLines.length > 0 && (
        <div className="streaming-output">
          <div className="streaming-header">
            <span className={`streaming-status ${isStreaming ? "connected" : ""}`}>
              {isStreaming ? "●" : "○"} Stream
            </span>
            <button
              className="clear-stream-btn"
              onClick={clearStreamingOutput}
              title="Clear streaming output"
            >
              Clear
            </button>
          </div>
          <div className="streaming-body" ref={streamingEndRef}>
            {streamingLines.map((line, i) => (
              <pre key={i} className="stream-line">{line}</pre>
            ))}
          </div>
        </div>
      )}
      {streamingError && (
        <div className="streaming-error">
          <span>{streamingError}</span>
        </div>
      )}
    </div>
  );
};

export default TerminalComp;
