import React, { useState } from "react";
import { ReactTerminal } from "react-terminal";
import axios from "axios";
import "./Terminal.css";

const TerminalComp = () => {
  const [output, setOutput] = useState("");

  const handleCommand = async (command) => {
    try {
      const { data } = await axios.post("http://127.0.0.1:10000/gdb_command", {
        command: command,
        name: "program",
      });
      return data["result"];
    } catch (error) {
      return "Error executing command";
    }
  };

  return (
    <div className="terminal">
      <ReactTerminal
        themes={{
          "my-custom-theme": {
            themeBGColor: "#000",
            themeToolbarColor: "#000",
            themeColor: "#00FF00",
            themePromptColor: "#a917a8",
          },
        }}
        theme="my-custom-theme"
        commands={{
          myCommand: async (command) => {
            return await handleCommand(command);
          },
        }}
        defaultHandler={async (command) => {
          return await handleCommand(command);
        }}
      />
    </div>
  );
};

export default TerminalComp;
