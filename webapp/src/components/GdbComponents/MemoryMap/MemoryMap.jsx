import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";

import "./MemoryMap.css";
import axios from "axios";

const data = [
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
  "0x7fffffffe270: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00",
];
const MemoryMap = () => {
  const { refresh, memoryMap, setMemoryMap } = DataState();


  useEffect(() => {
    if (!refresh) return;

    const controller = new AbortController();

    const fetchMemoryMap = async () => {
      try {
        const data = await axios.post("http://127.0.0.1:10000/memory_map", {
          name: "program",
        }, { signal: controller.signal });
        setMemoryMap(data.data.result);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Memory map fetch failed:", error);
        }
      }
    };

    fetchMemoryMap();

    return () => controller.abort();
  }, [refresh, setMemoryMap]);

  return (
    <div>
      {/* MemoryMap */}
      <div className="memoryMap">
        {memoryMap
          ? memoryMap
          : data?.length > 0
          ? data.map((obj) => {
              return <a>{obj}</a>;
            })
          : ""}
      </div>
    </div>
  );
};

export default MemoryMap;
