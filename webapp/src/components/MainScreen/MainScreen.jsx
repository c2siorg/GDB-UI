import React from "react";
import "./MainScreen.css";
import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { DataState } from "../../context/DataContext";

const MainScreen = () => {
  const { isDarkMode, setTextCode } = DataState();

  const debounceTimeoutRef = useRef(null);

  const debounce = (callback, delay) => {
    return (...args) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };

  const handleEdtorChange = debounce((value) => {
    setTextCode(value);
  }, 300);

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
          onChange={handleEdtorChange}
        />
      </div>
    </div>
  );
};

export default MainScreen;
