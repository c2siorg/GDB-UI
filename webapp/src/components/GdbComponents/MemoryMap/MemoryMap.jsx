import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";
import "./MemoryMap.css";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const hardcodedData = [
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

  const fetchMemoryMap = async () => {
    console.log("Click from memory map");
    const data = await axios.post(`${API_BASE_URL}/memory_map`, {
      name: "program",
    });
    console.log(data.data.result);
    setMemoryMap(data.data.result);
  };

  useEffect(() => {
    if (refresh) fetchMemoryMap();
  }, [refresh]);

  return (
    <div>
      <div className="memoryMap">
        {memoryMap
          ? memoryMap
          : hardcodedData?.length > 0
          ? hardcodedData.map((obj, index) => {
              return <a key={index}>{obj}</a>;
            })
          : ""}
      </div>
    </div>
  );
};

export default MemoryMap;
