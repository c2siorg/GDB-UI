import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const hardcodedData = [
  {
    offset: "0x2fffa36f603112ffff34",
    addr: "/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18",
  },
  {
    offset: "0x2fffa36f603112ffff34",
    addr: "/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18",
  },
  {
    offset: "0x2fffa36f603112ffff34",
    addr: "/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18",
  },
  {
    offset: "0x2fffa36f603112ffff34",
    addr: "/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18",
  },
];

const BreakPoints = () => {
  const { refresh, setInfoBreakpointData, infoBreakpointData } = DataState();

  const fetchInfoBreakpoints = async () => {
    const data = await axios.post(`${API_BASE_URL}/info_breakpoints`, {
      name: "program",
    });
    console.log(data.data["result"]);
    setInfoBreakpointData(data.data["result"]);
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
        {infoBreakpointData
          ? infoBreakpointData
          : hardcodedData?.length > 0
          ? hardcodedData.map((obj, index) => {
              return (
                <div key={index}>
                  <div>{obj.offset}</div>
                  <div>{obj.addr}</div>
                </div>
              );
            })
          : infoBreakpointData}
      </div>
    </div>
  );
};

export default BreakPoints;