import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import axios from "axios";

const Stack = () => {
  const { refresh, stack, setStack } = DataState();

  const fetchStackData = async () => {
    try {
      const data = await axios.post("http://127.0.0.1:10000/stack_trace", {
        name: "program",
      });
      setStack(data.data.result);
    } catch (error) {
      console.error("Error fetching stack:", error);
    }
  };

  useEffect(() => {
    if (refresh) fetchStackData();
  }, [refresh]);

  return (
    <div className="stack-parent">
      <div className="stack-heading">Stack</div>
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
