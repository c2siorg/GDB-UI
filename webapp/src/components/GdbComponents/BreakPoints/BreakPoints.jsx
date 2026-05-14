import React, { useEffect, useState } from "react";
import { DataState } from "./../../../context/DataContext";
import "./BreakPoints.css";
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
  const { infoBreakpointData } = DataState();

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
        { }
      </div>
    </div>
  );
};

export default BreakPoints;
