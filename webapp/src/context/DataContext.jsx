import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import useSession from "../hooks/useSession";
import useStreamingOutput from "../hooks/useStreamingOutput";
import { onSessionExpired, makeRequest } from "../api";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const session = useSession();
  const streaming = useStreamingOutput(session.sessionId, session.wsToken);
  const [isDarkMode, setDarkMode] = useState("dark");
  const [dark, setDark] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [stack, setStack] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [infoBreakpointData, setInfoBreakpointData] = useState("");
  const [memoryMap, setMemoryMap] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [commandCount, setCommandCount] = useState(0);

  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("program.cpp");
  const [compiling, setCompiling] = useState(false);

  const compileCode = async () => {
    if (!session.sessionId) {
      return;
    }
    setCompiling(true);
    try {
      const response = await makeRequest("/compile", {
        code,
        name: filename,
      }, session.sessionId);
      setRefresh(prev => !prev);
      return response.data;
    } catch (error) {
      console.error("Compilation failed in API call:", error);
      throw error;
    } finally {
      setCompiling(false);
    }
  };

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
    setCommandCount((prev) => prev + 1);
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
        setCommandCount,
        commandCount,
        runCommandInTerminal,
        setTerminalOutput,
        code,
        setCode,
        filename,
        setFilename,
        compiling,
        compileCode,
        streamingLines: streaming.lines,
        isStreaming: streaming.isConnected,
        streamingError: streaming.error,
        clearStreamingOutput: streaming.clearOutput,
        sessionId: session.sessionId,
        wsToken: session.wsToken,
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
