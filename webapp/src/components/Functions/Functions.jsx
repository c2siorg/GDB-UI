import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
const data = [
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
  "sub.KERNEL32.dll_DeleteCritical_231",
];

const Functions = () => {
  const { functions } = DataState();

  return (
    <div className="functions-parent">
      <a className="functions-heading"> Functions</a>
      offset
      <div className="functions">
        {functions}
        {data.map((obj) => {
          return <a>{obj}</a>;
        })}
        {/* <a>sub.KERNEL32.dll_DeleteCritical_231</a> */}
      </div>
    </div>
  );
};

export default Functions;
