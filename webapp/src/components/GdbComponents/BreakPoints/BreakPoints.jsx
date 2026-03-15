import React, { useEffect, useState } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
import axios from "axios";

const data = [
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


  useEffect(() => {
    if (!refresh) return;

    const controller = new AbortController();

    const fetchInfoBreakpoints = async () => {
      try {
        const data = await axios.post("http://127.0.0.1:10000/info_breakpoints", {
          name: "program",
        }, { signal: controller.signal });
        setInfoBreakpointData(data.data["result"]);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Breakpoints fetch failed:", error);
        }
      }
    };

    fetchInfoBreakpoints();

    return () => controller.abort();
  }, [refresh, setInfoBreakpointData]);
  return (
    <div>
      {/* BreakPoints */}
      <div className="breakpoints">
        {infoBreakpointData
          ? infoBreakpointData
          : data?.length > 0
          ? data.map((obj) => {
              return (
                <div>
                  <div>{obj.offset}</div>
                  <div>{obj.addr}</div>
                </div>
              );
            })
          : infoBreakpointData}
        {}
      </div>
    </div>
  );
};

export default BreakPoints;
