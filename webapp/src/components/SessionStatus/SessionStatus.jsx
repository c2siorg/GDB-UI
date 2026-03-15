import React from "react";
import "./SessionStatus.css";

const SessionStatus = ({ status, sessionId }) => {
  const getStatusColor = () => {
    if (status === "connected") return "status-connected";
    if (status === "connecting") return "status-connecting";
    return "status-disconnected";
  };

  const getStatusText = () => {
    if (status === "connected") return "Connected";
    if (status === "connecting") return "Connecting...";
    return "Disconnected";
  };

  return (
    <div className="session-status-wrapper">
      <div className={`status-badge ${getStatusColor()}`}>
        <span className="status-dot"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      {sessionId && (
        <div className="session-id">
          <span className="session-label">Session ID:</span>
          <span className="session-value">{sessionId}</span>
        </div>
      )}
    </div>
  );
};

export default SessionStatus;