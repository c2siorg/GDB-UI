import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";

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

  const fetchData = useCallback(async () => {
    if (refresh) {
      try {
        setRefresh(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setRefresh(false);
      }
    }
  }, [refresh]);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:10000/get_csrf_token");
        axios.defaults.headers.common["X-CSRFToken"] = response.data.csrf_token;
        axios.defaults.withCredentials = true;
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };
    fetchCsrfToken();
  }, []);

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
