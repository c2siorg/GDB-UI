import React from 'react'
import './Threads.css'

const data = [
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
  {
    func: 'main',
    file: 'temp.cpp:18',
    addr: '0x10FFF3423WS3234234C',
    args: 'args',
  },
]

const Threads = () => {
  return (
    <div>
      {/* Threads */}
      <div className="threads">
        <div className="threads-component">
          <div className="threads-component-part1">func</div>
          <div className="threads-component-part2">file</div>
          <div className="threads-component-part3">addr</div>
          <div className="threads-component-part4">args</div>
        </div>
        <div className="threads-lower">
          {data?.length > 0
            ? data.map((obj) => {
                return (
                  <div className="threads-component">
                    <div className="threads-component-part1">{obj.func}</div>
                    <div className="threads-component-part2">{obj.file}</div>
                    <div className="threads-component-part3">{obj.addr}</div>
                    <div className="threads-component-part4">{obj.args}</div>
                  </div>
                )
              })
            : ''}
        </div>
      </div>
    </div>
  )
}

export default Threads
