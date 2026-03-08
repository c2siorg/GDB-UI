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
  const [isDarkMode, setDarkMode] = useState("dark");
  const [dark, setDark] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [stack, setStack] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [infoBreakpointData, setInfoBreakpointData] = useState("");
  const [memoryMap, setMemoryMap] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [commandPress, setCommandPress] = useState(true);

  const fetchStackData = async () => {
    try {
      const data = await axios.post("http://127.0.0.1:10000/stack_trace", {
        name: "program",
      });
      setStack(data.data.result);
    } catch (error) {
      console.error("Error fetching stack data:", error);
    }
  };

  const fetchFunctionsData = async () => {
    try {
      const data = await axios.post("http://127.0.0.1:10000/get_locals", {
        name: "program",
      });
      setFunctions(data.data.result);
    } catch (error) {
      console.error("Error fetching functions data:", error);
    }
  };

  const fetchInfoBreakpoints = async () => {
    try {
      const data = await axios.post("http://127.0.0.1:10000/info_breakpoints", {
        name: "program",
      });
      setInfoBreakpointData(data.data.result);
    } catch (error) {
      console.error("Error fetching breakpoints data:", error);
    }
  };

  const fetchMemoryMap = async () => {
    try {
      const data = await axios.post("http://127.0.0.1:10000/memory_map", {
        name: "program",
      });
      setMemoryMap(data.data.result);
    } catch (error) {
      console.error("Error fetching memory map data:", error);
    }
  };

  const fetchData = useCallback(async () => {
    if (refresh) {
      try {
        await Promise.all([
          fetchStackData(),
          fetchFunctionsData(),
          fetchInfoBreakpoints(),
          fetchMemoryMap(),
        ]);
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

  const runCommandInTerminal = (command) => {
    setTerminalOutput(command);
  };

  return (
    <DataContext.Provider
      value={{
        refresh,
        setRefresh,
        stack,
        setStack,
        functions,
        setFunctions,
        infoBreakpointData,
        setInfoBreakpointData,
        memoryMap,
        setMemoryMap,
        isDarkMode,
        setDarkMode,
        dark,
        setDark,
        terminalOutput,
        setCommandPress,
        commandPress,
        setTerminalOutput,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const DataState = () => {
  return useContext(DataContext);
};

export default DataProvider;
