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
          height="54vh"
          className="mainScreen"
          defaultLanguage="cpp"
          defaultValue="// some comment"
          theme={isDarkMode === "dark" ? "vs-dark" : "vs"}
        />
      </div>
    </div>
  );
};

export default MainScreen;
