import React from "react";
import "./Context.css";

const Context = () => {
  return (
    <div>
      {/* Context */}
      <div className="context">
        <p>$ cat /proc/24963/maps ... lots of stuff omitted ...</p>
        <p>
          {" "}
          555555559000-55555557a000 rw-p 00000000 00:00 0 [heap] ... lots of
          stuff
        </p>
        <p>
          {" "}
          omitted ... 7ffffffde000-7ffffffff000 rw-p 00000000 00:00 0 (gdb)
          x/10x
        </p>
        <p>
          {" "}
          0x5555555592a0 0x5555555592a0: 0x62 0x61 0x6e 0x61 0x6e 0x61 0x73 0x00
        </p>
        <p>0x5555555592a8: 0x00 0x00</p>
      </div>
    </div>
  );
};

export default Context;
