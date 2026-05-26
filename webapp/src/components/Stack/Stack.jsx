import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import { makeRequest } from "../../api";

const Stack = () => {
  const {
    refresh,
    stack,
    setStack,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();

  const fetStackData = async () => {
    try {
      console.log("click from stack");
      const response = await makeRequest("/stack_trace", {
        name: "program",
      }, sessionId);
      console.log(response.data.result);
      setStack(response.data.result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refresh && sessionId) fetStackData();
  }, [refresh, sessionId]);

  if (sessionLoading) {
    return (
      <div className="stack-parent loading-container">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="stack-parent error-container">
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
      <div className="stack-parent error-container">
        <p>No active session.</p>
        <button className="save-button" onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

  return (
    <div className="stack-parent">
      <div className="stack-heading">Stack</div>
      Offset
      <div className="stack">
        <div>{stack}</div>
      </div>
    </div>
  );
};

export default Stack;
