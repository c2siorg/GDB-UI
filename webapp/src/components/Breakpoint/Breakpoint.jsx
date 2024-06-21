import React from "react";
import "./Breakpoint.css";

const Breakpoint = () => {
  return (
    <div className="breakpoint-container">
      <div className="add-breakpoint">Add Breakpoint</div>
      <div className="lower-breakpoint">
        <div className="line-breakpoint">
          <a>Line</a>
          <input type="text" name="" id="" />
        </div>
        <div className="line-breakpoint">
          <a>Function</a>
          <input type="text" name="" id="" />
        </div>
      </div>
    </div>
  );
};

export default Breakpoint;
