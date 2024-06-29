import React from "react";
import { ReactTerminal } from "react-terminal";

import "./Terminal.css";

const TerminalComp = () => {
  return (
    <div className="terminal">
      TerminalComp
      <ReactTerminal
        themes={{
          "my-custom-theme": {
            themeBGColor: "#000",
            themeToolbarColor: "#000",
            themeColor: "#FFFEFC",
            themePromptColor: "#a917a8",
          },
        }}
        theme="my-custom-theme"
      />
    </div>
  );
};

export default TerminalComp;
