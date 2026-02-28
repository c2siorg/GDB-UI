import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import api from "../../api";

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

  const fetchFunctionsData = async () => {
    try {
      console.log("click from functions");
      const data = await api.post("/get_locals", {
        name: "program",
      });
      console.log(data.data.result);
      setFunctions(data.data.result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refresh) {
      fetchFunctionsData();
    }
  }, [refresh]);

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
