import React, { createContext, useState, useContext } from "react";

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
