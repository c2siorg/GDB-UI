import React from "react";
import { ReactTerminal } from "react-terminal";

import "./Terminal.css";

const TerminalComp = () => {
  return (
    <div>
      TerminalComp
      <div className="terminal">
        <ReactTerminal
          themes={{
            "my-custom-theme": {
              themeBGColor: "#000",
              themeToolbarColor: "#DBDBDB",
              themeColor: "#FFFEFC",
              themePromptColor: "#a917a8",
            },
          }}
          theme="my-custom-theme"
        />
      </div>
    </div>
  );
};

export default TerminalComp;
