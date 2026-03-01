import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import { makeRequest } from "../../api";

const Functions = () => {
  const { refresh, functions, setFunctions, sessionId } = DataState();

  const fetchFunctionsData = async () => {
    try {
      console.log("click from functions");
      const response = await makeRequest("/get_locals", {
        name: "program",
      }, sessionId);
      console.log(response.data.result);
      setFunctions(response.data.result);
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
        {/* <a>sub.KERNEL32.dll_DeleteCritical_231</a> */}
      </div>
    </div>
  );
};

export default Functions;
