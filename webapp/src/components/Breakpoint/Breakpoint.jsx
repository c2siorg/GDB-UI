import React, { useState } from "react";
import "./Breakpoint.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataState } from "../../context/DataContext";
import api from "../../api";

const Breakpoint = () => {
  const [breakLine, setBreakLine] = useState("");
  const [breakFunction, setBreakFunction] = useState("");
  const { fileName = "program" } = DataState() || {};

  const handleBreakSave = async (e) => {
    e.preventDefault();
    if (breakLine === "" && breakFunction === "") {
      toast.error("Enter any of the field", {
        autoClose: 1000,
      });
      return;
    }
    try {
      const data = await api.post("/set_breakpoint", {
        location: breakFunction || breakLine,
        name: fileName,
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
      <ToastContainer
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Breakpoint;
