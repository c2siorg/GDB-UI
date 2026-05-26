import React, { useState } from "react";
import "./Breakpoint.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { makeRequest } from "../../api";
import { DataState } from "../../context/DataContext";

const Breakpoint = () => {
  const [breakLine, setBreakLine] = useState("");
  const [breakFunction, setBreakFunction] = useState("");
  const {
    sessionId,
    sessionLoading,
    sessionError,
    createSession,
    clearSessionError
  } = DataState();

  const handleBreakSave = async (e) => {
    e.preventDefault();
    if (!breakLine && !breakFunction) {
      toast.error("Enter any of the field", {
        autoClose: 1000,
      });
      return;
    }
    try {
      const data = await makeRequest("/set_breakpoint", {
        location: breakLine,
        name: "program",
      }, sessionId);
      console.log(data);
      toast.success("Added breakpoint", {
        autoClose: 1000,
      });
    } catch (error) {
      toast.error("Something went Wrong", {
        autoClose: 1000,
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="breakpoint-container loading-container">
        <div className="pulse-spinner"></div>
        <p>Initializing debug session...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="breakpoint-container error-container">
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
      <div className="breakpoint-container error-container">
        <p>No active session.</p>
        <button className="save-button" onClick={createSession}>Start Debug Session</button>
      </div>
    );
  }

  return (
    <div className="breakpoint-container">
      <div className="add-breakpoint">Add Breakpoint</div>
      <div className="lower-breakpoint">
        <div className="line-breakpoint">
          <a>Line</a>
          <input
            type="text"
            name=""
            id=""
            value={breakLine}
            onChange={(e) => setBreakLine(e.target.value)}
          />
        </div>
        <div className="line-breakpoint">
          <a>Function</a>
          <input
            type="text"
            name=""
            id=""
            value={breakFunction}
            onChange={(e) => setBreakFunction(e.target.value)}
          />
        </div>
        <button className="save-button" onClick={handleBreakSave}>
          Add
        </button>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Breakpoint;
