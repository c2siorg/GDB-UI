import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import axios from "axios";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false);
  const [stack, setStack] = useState([]);
  const [functions, setFunctions] = useState([]);

  const fetchData = useCallback(async () => {
    if (refresh) {
      try {
        const stackResponse = await axios.get("/api/stack");
        const functionsResponse = await axios.get("/api/functions");

        setStack(stackResponse.data);
        setFunctions(functionsResponse.data);

        setRefresh(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setRefresh(false);
      }
    }
  }, [refresh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ refresh, setRefresh, stack, functions }}>
      {children}
    </DataContext.Provider>
  );
};

export const DataState = () => {
  return useContext(DataContext);
};

export default DataProvider;
