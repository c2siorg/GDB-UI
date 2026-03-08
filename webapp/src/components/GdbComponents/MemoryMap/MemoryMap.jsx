import React, { useEffect } from "react";
import { DataState } from "./../../../context/DataContext";

import "./MemoryMap.css";
import axios from "axios";

const MemoryMap = () => {
  const { refresh, memoryMap, setMemoryMap } = DataState();

  const fetchMemoryMap = async () => {
    console.log("Click form memory map");
    const data = await axios.post("http://127.0.0.1:10000/memory_map", {
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
      {/* MemoryMap */}
      <div className="memoryMap">
        {memoryMap ? memoryMap : ""}
      </div>
    </div>
  );
};

export default MemoryMap;
