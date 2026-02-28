import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import axios from "axios";



const Functions = () => {
  const { refresh, functions, setFunctions } = DataState();

  const fetchFunctionsData = async () => {
    try {
      console.log("click from functions");
      const data = await axios.post("http://127.0.0.1:10000/get_locals", {
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
      </div>
    </div>
  );
};

export default Functions;
