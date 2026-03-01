import React, { useEffect, useState } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
import { makeRequest } from "../../../api";

const BreakPoints = () => {
  const { refresh, setInfoBreakpointData, infoBreakpointData, sessionId } = DataState();

  const fetchInfoBreakpoints = async () => {
    try {
      const response = await makeRequest("/info_breakpoints", {
        name: "program",
      }, sessionId);
      setInfoBreakpointData(response.data["result"]);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (refresh) {
      console.log("click from breakpoint in GdbComponents");
      fetchInfoBreakpoints();
    }
  }, [refresh]);
  return (
    <div>
      <div className="breakpoints">
        {infoBreakpointData}
      </div>
    </div>
  );
};

export default BreakPoints;
