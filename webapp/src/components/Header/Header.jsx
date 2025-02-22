import React from "react";
import "./Header.css";
import c2si from "../../assets/c2si.png";
import { Link } from "react-router-dom";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { FaGithub } from "react-icons/fa";

const Header = ({ isDarkMode, toggleDarkMode, dark }) => {
  return (
    <div className="header">
      <div className="head">
        <div className="img">
          <img src={c2si} alt="C2si" />
        </div>        
        <div className="login">
        <div className="github">
          <button className="github-button" onClick={() => window.open("https://github.com/c2siorg/GDB-UI", "_blank")}>
            <FaGithub size={37}  className="github-icon"/>
          </button>
        </div>
          <div className="darkmode">
            <DarkModeSwitch
              style={{ marginBottom: "2rem" }}
              checked={dark}
              onChange={toggleDarkMode}
              size={20}
            />
          </div>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
