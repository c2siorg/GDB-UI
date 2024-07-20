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
import { DataContext } from "../../context/DataContext";

import "./DebugHeader.css";

const DebugHeader = () => {
  const { refresh, setRefresh } = useContext(DataContext);

  return (
    <div className="parent-debug-header">
      <div className="debug-header">
        <div className="icons">
          <div className="arrow">
            <FaArrowLeft className="icon" />
            <FaArrowRight className="icon" />
          </div>
          <div className="others">
            <IoReload className="icon" />
            <FaForward className="icon" />
            <FaSquare className="icon" />
            <MdSkipNext className="icon" />
            <MdSkipPrevious className="icon" />
            <BsArrowRightSquareFill className="icon" />
          </div>
        </div>
        <div className="filename">
          <div className="filename-content">filename</div>
        </div>
        <div className="save">
          <button className="save-button" onClick={() => setRefresh(!refresh)}>
            {refresh ? "Saving.." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugHeader;
