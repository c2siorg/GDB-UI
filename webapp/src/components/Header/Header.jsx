import React from "react";
import "./Header.css";
import c2si from "../../assets/c2si.png";
import { Link } from "react-router-dom";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { IoHomeOutline } from "react-icons/io5";

const Header = ({ isDarkMode, toggleDarkMode, dark }) => {
  return (
    <div className="header">
      <div className="head">
        <div className="img">
          <img src={c2si} alt="C2si" />
        </div>
        <div className="login">
          <nav className="nav-links" aria-label="Main navigation">
            <Link to="/" className="home-btn">
              <IoHomeOutline aria-hidden="true" />
              <span>Home</span>
            </Link>
          </nav>
          <div className="darkmode">
            <DarkModeSwitch
              checked={dark}
              onChange={toggleDarkMode}
              size={24}
            />
          </div>
          <Link to="/login" className="nav-login-btn">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
