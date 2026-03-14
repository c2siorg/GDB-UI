import React from "react";
import { DataState } from "../../context/DataContext";
import "./SessionBadge.css";

const SessionBadge = () => {
  const { sessionId, connectionStatus } = DataState();

  const getStatusClass = () => {
    switch (connectionStatus) {
      case "Connected":
        return "status-connected";
      case "Connecting...":
        return "status-connecting";
      default:
        return "status-disconnected";
    }
  };

  const displayId = sessionId ? sessionId.substring(0, 8) : "";

  return (
    <div className="session-badge">
      <div className={`status-dot ${getStatusClass()}`}></div>
      <span className="status-text">{connectionStatus}</span>
      {connectionStatus === "Connected" && displayId && (
        <span className="session-id">#{displayId}</span>
      )}
    </div>
  );
};

export default SessionBadge;
