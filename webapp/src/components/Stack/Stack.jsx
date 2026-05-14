import React, { useEffect, useState } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import axios from "axios";

const Stack = () => {
  const { refresh, stack, setStack } = DataState();
  const [isLoading, setIsLoading] = useState(false);

  const fetStackData = async () => {
    try {
      setIsLoading(true);
      console.log("click from stack");
      const data = await axios.post("http://127.0.0.1:10000/stack_trace", {
        name: "program",
      });
      console.log(data.data.result);
      setStack(data.data.result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
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
        {isLoading ? (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>Fetching stack trace...</div>
        ) : stack ? (
          <div>{stack}</div>
        ) : (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>Stack trace is empty. Call frames will appear here during execution.</div>
        )}
      </div>
    </div>
  );
};

export default Stack;
