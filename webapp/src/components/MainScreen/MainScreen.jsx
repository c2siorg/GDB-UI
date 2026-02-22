import React from "react";
import "./MainScreen.css";
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";

// Define custom Monaco themes that match the UI
const defineCustomThemes = (monaco) => {
  monaco.editor.defineTheme("obsidian", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a0a0f",
      "editor.foreground": "#e4e4ef",
      "editorLineNumber.foreground": "#5a5a72",
      "editorLineNumber.activeForeground": "#9898b0",
      "editor.lineHighlightBackground": "#111118",
      "editor.selectionBackground": "#00e5ff20",
      "editorCursor.foreground": "#00e5ff",
      "editorWidget.background": "#16161f",
      "editorWidget.border": "#2a2a3a",
      "input.background": "#111118",
      "input.border": "#2a2a3a",
      "scrollbarSlider.background": "#2a2a3a80",
      "scrollbarSlider.hoverBackground": "#3a3a52",
    },
  });

  monaco.editor.defineTheme("bone", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#2d2d2d",
      "editorLineNumber.foreground": "#9a9a9a",
      "editorLineNumber.activeForeground": "#5c5c5c",
      "editor.lineHighlightBackground": "#f5f0e8",
      "editor.selectionBackground": "#c45d3e18",
      "editorCursor.foreground": "#c45d3e",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#ddd5c8",
      "input.background": "#ffffff",
      "input.border": "#ddd5c8",
      "scrollbarSlider.background": "#c5baa880",
      "scrollbarSlider.hoverBackground": "#c5baa8",
    },
  });
};

// Register themes before Monaco loads
loader.init().then(defineCustomThemes);

const MainScreen = () => {
  const { isDark } = useTheme();

  return (
    <div className="mainScreen">
      <Editor
        height="35vh"
        defaultLanguage="cpp"
        defaultValue="// some comment"
        theme={isDark ? "obsidian" : "bone"}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          cursorStyle: "line",
          cursorWidth: 2,
        }}
      />
    </div>
  );
};

export default MainScreen;
