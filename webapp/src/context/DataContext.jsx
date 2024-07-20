import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false);
  const [stack, setStack] = useState([]);
  const [functions, setFunctions] = useState([]);

  const fetchData = useCallback(async () => {
    if (refresh) {
      try {
      } catch (error) {
        console.error("Error fetching data:", error);
        setRefresh(!refresh);
      }
    }
  });

  useEffect(() => {
    fetchData();
  }, [refresh]);

  return (
    <DataContext.Provider value={{ refresh, setRefresh, stack, functions }}>
      {children}
    </DataContext.Provider>
  );
};
