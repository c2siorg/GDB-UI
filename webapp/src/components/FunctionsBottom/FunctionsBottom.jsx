import React from "react";
import "./FunctionsBottom.css";

const FunctionsBottom = () => {
  return (
    <div className="function-bottom">
      <div className="function-bottom-heading">Search</div>
      <div>
        <input
          type="text"
          className="function-bottom-container"
          placeholder="Search"
        />
      </div>
    </div>
  );
};

export default FunctionsBottom;
