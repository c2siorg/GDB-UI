import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
const Stack = () => {
  const { stack } = DataState();

  return (
    <div className="stack-parent">
      <div className="stack-heading">Stack</div>
      Offset
      <div className="stack">
        <div>{stack}</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
      </div>
    </div>
  );
};

export default Stack;
