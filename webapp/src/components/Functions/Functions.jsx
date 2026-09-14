import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import { makeRequest } from "../../api";

const Functions = () => {
  const {
    refresh,
    functions,
    setFunctions,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();

  const fetchFunctionsData = async () => {
    try {
      console.log("click from functions");
      const response = await makeRequest("/get_locals", {
        name: "program",
      }, sessionId);
      console.log(response.data.result);
      setFunctions(response.data.result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refresh && sessionId) {
      fetchFunctionsData();
    }
  }, [refresh, sessionId]);

  if (sessionLoading) {
    return (
      <div className="functions-parent loading-container">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="functions-parent error-container">
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
      <div className="functions-parent error-container">
        <p>No active session.</p>
        <button className="save-button" onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

  return (
    <div className="functions-parent">
      <a className="functions-heading"> Functions</a>
      <div className="functions">
        {functions}
      </div>
    </div>
  );
};

export default Functions;
