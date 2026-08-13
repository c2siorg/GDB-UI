import "./Header.css";
import c2si from "../../assets/c2si.png";
import { Link } from "react-router-dom";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import PropTypes from "prop-types";

const Header = ({ toggleDarkMode, dark }) => {
  return (
    <div className="header">
      <div className="head">
        <div className="img">
          <img src={c2si} alt="C2si" />
        </div>
        <div className="login">
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

Header.propTypes = {
  toggleDarkMode: PropTypes.func,
  dark: PropTypes.bool,
};

export default Header;
