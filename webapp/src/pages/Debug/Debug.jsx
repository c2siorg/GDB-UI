import React, { useState, useEffect } from "react";
import "./Debug.css";
import Header from "../../components/Header/Header";
import DebugHeader from "../../components/DebugHeader/DebugHeader";
import Functions from "../../components/Functions/Functions";
import MainScreen from "../../components/MainScreen/MainScreen";
import Stack from "../../components/Stack/Stack";
import TerminalComp from "../../components/Terminal/TerminalComp";
import GdbComponents from "../../components/GdbComponents/GdbComponents";
import Breakpoint from "../../components/Breakpoint/Breakpoint";
import StackBottom from "../../components/StackBottom/StackBottom";
import FunctionsBottom from "../../components/FunctionsBottom/FunctionsBottom";
import KeyboardShortcutsHelp from "../../components/KeyboardShortcutsHelp/KeyboardShortcutsHelp";
import {
  KEYBOARD_SHORTCUTS,
  isShortcutPressed,
} from "../../utils/keyboardShortcuts";
import { DataState } from "../../context/DataContext";

const Debug = () => {
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const { setTerminalOutput } = DataState();

  /**
   * Executes a GDB command by sending it to the terminal output
   * @param {string} command - The GDB command to execute
   */
  const executeGdbCommand = (command) => {
    setTerminalOutput(command);
  };

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = (event) => {
    // Don't intercept shortcuts when typing in input fields
    if (
      ['INPUT', 'TEXTAREA'].includes(event.target.tagName) &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      return;
    }

    // Check for Ctrl+K (Show Shortcuts)
    if (isShortcutPressed(event, KEYBOARD_SHORTCUTS.F5.key)) {
      event.preventDefault();
      executeGdbCommand(KEYBOARD_SHORTCUTS.F5.gdbCommand);
    } else if (isShortcutPressed(event, KEYBOARD_SHORTCUTS.F10.key)) {
      event.preventDefault();
      executeGdbCommand(KEYBOARD_SHORTCUTS.F10.gdbCommand);
    } else if (isShortcutPressed(event, KEYBOARD_SHORTCUTS.F11.key)) {
      event.preventDefault();
      executeGdbCommand(KEYBOARD_SHORTCUTS.F11.gdbCommand);
    } else if (isShortcutPressed(event, KEYBOARD_SHORTCUTS['Shift+F11'].key)) {
      event.preventDefault();
      executeGdbCommand(KEYBOARD_SHORTCUTS['Shift+F11'].gdbCommand);
    } else if (isShortcutPressed(event, KEYBOARD_SHORTCUTS['Ctrl+B'].key)) {
      event.preventDefault();
      // Toggle breakpoint logic would go here
      // This typically involves getting current line and toggling breakpoint
    } else if (isShortcutPressed(event, KEYBOARD_SHORTCUTS['Ctrl+K'].key)) {
      event.preventDefault();
      setShowShortcutsHelp((prev) => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div>
      <DebugHeader />
      <div className="container">
        <div className="left-part">
          <Functions />
          <FunctionsBottom />
        </div>
        <div className="middle-component">
          <div className="upper-part">
            <MainScreen />
            <TerminalComp />
          </div>
          <div className="lower-part">
            <GdbComponents />
            <Breakpoint />
          </div>
        </div>
        <div className="right-part">
          <Stack />
          <StackBottom />
        </div>
      </div>
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
};

export default Debug;
