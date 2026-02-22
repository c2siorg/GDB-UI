import React from "react";
import "./MainScreen.css";
import Editor from "@monaco-editor/react";
import { DataState } from "../../context/DataContext";

const MainScreen = () => {
  const { isDarkMode } = DataState();
  return (
    <div>
      MainScreen
      <div className="mainScreen">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="cpp"
          defaultValue="// some comment"
          theme={isDarkMode === "dark" ? "vs-dark" : "vs"}
        />
      </div>
    </div>
  );
};

export default MainScreen;
