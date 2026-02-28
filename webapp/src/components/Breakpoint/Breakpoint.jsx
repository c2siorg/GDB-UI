import React, { useState } from "react";
import "./Breakpoint.css";
import { toast } from "react-toastify";
import axios from "axios";

const Breakpoint = () => {
  const [breakLine, setBreakLine] = useState("");
  const [breakFunction, setBreakFunction] = useState("");

  const handleBreakSave = async (e) => {
    e.preventDefault();
    if (!breakLine && !breakFunction) {
      toast.error("Enter any of the field", {
        autoClose: 1000,
      });
      return;
    }
    try {
      const data = await axios.post("http://127.0.0.1:10000/set_breakpoint", {
        location: breakLine,
        name: "program",
      });
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
    </div>
  );
};

export default Breakpoint;
