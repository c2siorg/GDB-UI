import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to backend auth
    navigate("/debug");
  };

  return (
    <main className="login-container" id="login-page">
      <div className="login-box">
        <button
          id="login-back-btn"
          className="back-btn"
          onClick={() => navigate("/")}
          type="button"
        >
          ← Back
        </button>
        <h2>Welcome to GDB-UI</h2>
        <p>Demo / No auth yet</p>
        <form onSubmit={handleSubmit} aria-label="Login form">
          <button id="login-submit-btn" type="submit" className="login-btn">
            Continue to Debugger
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
