import React, { useEffect } from "react";
import { DataState } from "./../../context/DataContext";
import "./Stack.css";
import { toast } from "react-toastify";
import api from "../../api";

const Stack = () => {
  const { refresh, stack, setStack } = DataState();

  const fetStackData = async () => {
    try {
      console.log("click from stack");
      const data = await api.post("/stack_trace", {
        name: "program",
      });
      console.log(data.data.result);
      setStack(data.data.result);
    } catch (error) {
      toast.error("Failed to fetch Stack trace data");
    }
  };
  useEffect(() => {
    if (refresh) fetStackData();
  }, [refresh]);
  return (
    <div className="stack-parent">
      <div className="stack-heading">Stack</div>
      <div className="stack">
        <div>{stack}</div>
      </div>
    </div>
  );
};

export default Stack;
