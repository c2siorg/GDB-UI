import React, { useEffect, useState } from "react";
import { DataState } from "./../../context/DataContext";
import "./Functions.css";
import axios from "axios";

const Functions = () => {
  const { refresh, functions, setFunctions } = DataState();
  const [isLoading, setIsLoading] = useState(false);

  const fetchFunctionsData = async () => {
    try {
      setIsLoading(true);
      console.log("click from functions");
      const data = await axios.post("http://127.0.0.1:10000/get_locals", {
        name: "program",
      });
      console.log(data.data.result);
      setFunctions(data.data.result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
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
        {isLoading ? (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>Loading functions...</div>
        ) : functions ? (
          functions
        ) : (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>No functions traced yet. Break into execution to inspect frames.</div>
        )}
      </div>
    </div>
  );
};

export default Functions;
