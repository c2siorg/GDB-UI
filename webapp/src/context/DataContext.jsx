import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import useSession from "../hooks/useSession";
import { onSessionExpired } from "../api";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const session = useSession();
  const [isDarkMode, setDarkMode] = useState("dark");
  const [dark, setDark] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [stack, setStack] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [infoBreakpointData, setInfoBreakpointData] = useState("");
  const [memoryMap, setMemoryMap] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [commandPress, setCommandPress] = useState(true);

  // Register session expiry interceptor handler
  useEffect(() => {
    onSessionExpired((error) => {
      session.handleSessionError(error);
    });
  }, [session.handleSessionError]);

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
        sessionId: session.sessionId,
        sessionLoading: session.sessionLoading,
        sessionError: session.sessionError,
        createSession: session.createSession,
        endSession: session.endSession,
        handleSessionError: session.handleSessionError,
        clearSessionError: session.clearSessionError,
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
