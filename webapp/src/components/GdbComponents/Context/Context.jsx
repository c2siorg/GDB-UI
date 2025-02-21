import React from 'react'
import './Context.css'

const Context = () => {
  return (
    <div>
      {/* Context */}
      <div className="context">
        <a> $ cat /proc/24963/maps ... lots of stuff omitted ...</a>
        <a>
          {' '}
          555555559000-55555557a000 rw-p 00000000 00:00 0 [heap] ... lots of
          stuff
        </a>
        <a>
          {' '}
          omitted ... 7ffffffde000-7ffffffff000 rw-p 00000000 00:00 0 (gdb)
          x/10x
        </a>
        <a>
          {' '}
          0x5555555592a0 0x5555555592a0: 0x62 0x61 0x6e 0x61 0x6e 0x61 0x73 0x00
        </a>
        <a> 0x5555555592a8: 0x00 0x00</a>
      </div>
    </div>
  )
}

export default Context
