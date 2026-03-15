import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import axios from "axios";

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
  const { refresh, functions, setFunctions } = DataState();


  useEffect(() => {
    if (!refresh) return;

    const controller = new AbortController();

    const fetchFunctionsData = async () => {
      try {
        const data = await axios.post("http://127.0.0.1:10000/get_locals", {
          name: "program",
        }, { signal: controller.signal });
        setFunctions(data.data.result);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Functions fetch failed:", error);
        }
      }
    };

    fetchFunctionsData();

    return () => controller.abort();
  }, [refresh, setFunctions]);

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
