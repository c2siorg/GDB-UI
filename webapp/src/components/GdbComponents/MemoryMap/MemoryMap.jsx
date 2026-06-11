import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";
import "./MemoryMap.css";
import { makeRequest } from "../../../api";

const data = [
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
];

const MemoryMap = () => {
  const {
    refresh,
    memoryMap,
    setMemoryMap,
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();

  const fetchMemoryMap = async () => {
    try {
      const response = await makeRequest("/memory_map", {
        name: "program",
      }, sessionId);
      setMemoryMap(response.data.result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refresh && sessionId) fetchMemoryMap();
  }, [refresh, sessionId]);

  if (sessionLoading) {
    return (
      <div className="memoryMap loading-container">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="memoryMap error-container">
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
      <div className="memoryMap error-container">
        <p>No active session.</p>
        <button className="save-button" onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

  return (
    <div>
      {/* MemoryMap */}
      <div className="memoryMap">
        {memoryMap
          ? memoryMap
          : data?.length > 0
            ? data.map((obj, i) => {
              return <div key={i}>{obj}</div>;
            })
            : ""}
      </div>
    </div>
  );
};

export default MemoryMap;
