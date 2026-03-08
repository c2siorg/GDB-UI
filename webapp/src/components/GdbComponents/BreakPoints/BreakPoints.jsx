import React, { useEffect, useState } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
import axios from "axios";

const BreakPoints = () => {
  const { refresh, setInfoBreakpointData, infoBreakpointData } = DataState();
  const [isLoading, setIsLoading] = useState(false);

  const fetchInfoBreakpoints = async () => {
    try {
      setIsLoading(true);
      const data = await axios.post("http://127.0.0.1:10000/info_breakpoints", {
        name: "program",
      });
      console.log(data.data["result"]);
      setInfoBreakpointData(data.data["result"]);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
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
      {/* BreakPoints */}
      <div className="breakpoints">
        {isLoading ? (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>Loading breakpoints...</div>
        ) : infoBreakpointData ? (
          infoBreakpointData
        ) : (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>No breakpoints active. Set a breakpoint to pause execution.</div>
        )}
      </div>
    </div>
  );
};

export default BreakPoints;
