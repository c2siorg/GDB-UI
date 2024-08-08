import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import axios from "axios";

const Stack = () => {
  const { refresh, stack, setStack } = DataState();

  const fetStackData = async () => {
    try {
      console.log("click from stack");
      const data = await axios.post("http://127.0.0.1:10000/stack_trace", {
        name: "program",
      });
      console.log(data.data.result);
      setStack(data.data.result);
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
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
        <div>0x001780c8 0x001780c8 0x001780c8 0x001780c8</div>
      </div>
    </div>
  );
};

export default Stack;
