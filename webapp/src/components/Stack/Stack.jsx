import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import api from "../../api";

const Stack = () => {
  const { stack, setStack, refresh, fileName } = DataState();

  const fetStackData = async () => {
    try {
      console.log("click from stack");
      const data = await api.post("/stack_trace", {
        name: fileName,
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
      </div>
    </div>
  );
};

export default Stack;
