import React, { useContext } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaForward,
  FaSquare,
} from "react-icons/fa6";
import { IoReload } from "react-icons/io5";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { BsArrowRightSquareFill } from "react-icons/bs";
import { DataState } from "../../context/DataContext";

import { toast } from "react-toastify";
import "./DebugHeader.css";

const DebugHeader = () => {
  const {
    refresh,
    setRefresh,
    setTerminalOutput,
    setCommandCount,
    compiling,
    compileCode,
    filename,
  } = DataState();

  const handleRun = (command) => {
    setCommandCount(prev => prev + 1);
    setTerminalOutput(command);
  };

  const handleSave = async () => {
    try {
      await compileCode();
      toast.success("Code compiled successfully!", { autoClose: 2000 });
    } catch (err) {
      console.error("handleSave compile error:", err);
      toast.error(err.response?.data?.error?.message || "Compilation failed. Check logs.", { autoClose: 3000 });
    }
  };

  return (
    <div className="parent-debug-header">
      <div className="debug-header">
        <div className="icons">
          <div className="arrows">
            <button className="icon-btn" aria-label="Previous" onClick={() => handleRun("reverse-next")}>
              <FaArrowLeft className="icon" />
            </button>
            <button className="icon-btn" aria-label="Next" onClick={() => handleRun("next")}>
              <FaArrowRight className="icon" />
            </button>
          </div>
          <div className="others">
            <button className="icon-btn" aria-label="Run" onClick={() => handleRun("run")}>
              <IoReload className="icon" />
            </button>
            <button className="icon-btn" aria-label="Continue" onClick={() => handleRun("continue")}>
              <FaForward className="icon" />
            </button>
            <button className="icon-btn" aria-label="Stop" onClick={() => handleRun("stop")}>
              <FaSquare className="icon" />
            </button>
            <button className="icon-btn" aria-label="Step" onClick={() => handleRun("step")}>
              <MdSkipNext className="icon" />
            </button>
            <button className="icon-btn" aria-label="Finish" onClick={() => handleRun("finish")}>
              <MdSkipPrevious className="icon" />
            </button>
            <button className="icon-btn" aria-label="Step Out" onClick={() => handleRun("finish")}>
              <BsArrowRightSquareFill className="icon" />
            </button>
          </div>
        </div>
        <div className="filename">
          <div className="filename-content">{filename}</div>
        </div>
        <div className="save">
          <button className="save-button" onClick={handleSave} disabled={compiling}>
            {compiling ? "Compiling..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugHeader;
