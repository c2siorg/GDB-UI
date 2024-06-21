import React from "react";
import "./Header.css";
import c2si from "../../assets/c2si.png";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="header">
      <div className="head">
        <div className="img">
          <img src={c2si} alt="C2si" />
        </div>
        <div className="login">
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
