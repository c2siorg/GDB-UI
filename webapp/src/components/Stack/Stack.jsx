import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import { makeRequest } from "../../api";

const Stack = () => {
  const { refresh, stack, setStack, sessionId } = DataState();

  const fetStackData = async () => {
    try {
      console.log("click from stack");
      const response = await makeRequest("/stack_trace", {
        name: "program",
      }, sessionId);
      console.log(response.data.result);
      setStack(response.data.result);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (refresh) fetStackData();
  }, [refresh]);
  return (
    <div className="stack-parent">
      <div className="stack-heading">Stack</div>
      Offset
      <div className="stack">
        <div>{stack}</div>
      </div>
    </div>
  );
};

export default Stack;
