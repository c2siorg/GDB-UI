import React from "react";
import "./MainScreen.css";
import Editor from "@monaco-editor/react";
import { DataState } from "../../context/DataContext";

const MainScreen = () => {
  const { isDarkMode, code, setCode } = DataState();
  return (
    <div className="mainScreen">
      <Editor
        height="90vh"
        className="mainScreen"
        defaultLanguage="cpp"
        value={code}
        onChange={(val) => setCode(val || "")}
        theme={isDarkMode === "dark" ? "vs-dark" : "vs"}
      />
    </div>
  );
};

export default MainScreen;
