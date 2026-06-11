import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
import { makeRequest } from "../../../api";

const BreakPoints = () => {
  const {
    refresh,
    setInfoBreakpointData,
    infoBreakpointData,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();

  const fetchInfoBreakpoints = async () => {
    try {
      const response = await makeRequest("/info_breakpoints", {
        name: "program",
      }, sessionId);
      setInfoBreakpointData(response.data["result"]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refresh && sessionId) {
      console.log("click from breakpoint in GdbComponents");
      fetchInfoBreakpoints();
    }
  }, [refresh, sessionId]);

  if (sessionLoading) {
    return (
      <div className="breakpoints loading-container">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="breakpoints error-container">
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
      <div className="breakpoints error-container">
        <p>No active session.</p>
        <button className="save-button" onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

  return (
    <div>
      <div className="breakpoints">
        {infoBreakpointData}
      </div>
    </div>
  );
};

export default BreakPoints;
