import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        <p>Sign in to start debugging</p>
        <form onSubmit={handleSubmit} aria-label="Login form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button id="login-submit-btn" type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
