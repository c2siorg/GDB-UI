import React, { useEffect, useState } from "react";
import { DataState } from "./../../../context/DataContext";

import "./MemoryMap.css";
import axios from "axios";

const MemoryMap = () => {
  const { refresh, memoryMap, setMemoryMap } = DataState();
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemoryMap = async () => {
    try {
      setIsLoading(true);
      console.log("Click form memory map");
      const data = await axios.post("http://127.0.0.1:10000/memory_map", {
        name: "program",
      });
      console.log(data.data.result);
      setMemoryMap(data.data.result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (refresh) fetchMemoryMap();
  }, [refresh]);

  return (
    <div>
      {/* MemoryMap */}
      <div className="memoryMap">
        {isLoading ? (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>Loading memory layout...</div>
        ) : memoryMap ? (
          memoryMap
        ) : (
          <div style={{ opacity: 0.5, fontStyle: "italic", padding: "10px" }}>No memory layout available. Layout will appear here during execution.</div>
        )}
      </div>
    </div>
  );
};


export default MemoryMap;
