import React from "react";
import { useNavigate } from "react-router-dom";
import {
  VscSearch,
  VscDebugBreakpointLog,
  VscCallOutgoing,
  VscTerminal,
} from "react-icons/vsc";
import "./Home.css";

const features = [
  {
    icon: <VscSearch />,
    title: "Inspect Variables",
    desc: "Monitor variables and memory in real time as your program executes.",
  },
  {
    icon: <VscDebugBreakpointLog />,
    title: "Breakpoints",
    desc: "Set and manage breakpoints visually without typing GDB commands.",
  },
  {
    icon: <VscCallOutgoing />,
    title: "Stack Trace",
    desc: "Navigate the full call stack and jump to any frame instantly.",
  },
  {
    icon: <VscTerminal />,
    title: "Integrated Terminal",
    desc: "Run raw GDB commands directly from the built-in terminal.",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="home-container" id="home-page">
      <section className="hero" aria-label="GDB-UI introduction">
        <h1>
          Debug Smarter with <span className="highlight">GDB-UI</span>
        </h1>
        <p className="hero-sub">
          A modern web interface for the GNU Debugger. Visualize your program
          execution, inspect memory, and squash bugs faster than ever.
        </p>
        <div className="hero-buttons">
          <button
            id="get-started-btn"
            className="btn-primary"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
          <a
            id="github-link"
            className="btn-secondary"
            href="https://github.com/c2siorg/GDB-UI"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="features" aria-label="Features">
        {features.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon" aria-hidden="true">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Home;
