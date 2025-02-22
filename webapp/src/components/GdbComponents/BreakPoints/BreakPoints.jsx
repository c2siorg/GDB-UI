import React, { useEffect, useState } from 'react'
import { DataState } from './../../../context/DataContext'
import './BreakPoints.css'
import axios from 'axios'

const data = [
  {
    offset: '0x2fffa36f603112ffff34',
    addr: '/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18',
  },
  {
    offset: '0x2fffa36f603112ffff34',
    addr: '/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18',
  },
  {
    offset: '0x2fffa36f603112ffff34',
    addr: '/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18',
  },
  {
    offset: '0x2fffa36f603112ffff34',
    addr: '/Users/shubh/lib/node_modules/@stdlib/math/docs/t.js:18',
  },
]

const BreakPoints = () => {
  const { refresh, setInfoBreakpointData, infoBreakpointData } = DataState()

  const fetchInfoBreakpoints = async () => {
    const data = await axios.post('http://127.0.0.1:10000/info_breakpoints', {
      name: 'program',
    })
    console.log(data.data['result'])
    setInfoBreakpointData(data.data['result'])
  }
  useEffect(() => {
    if (refresh) {
      console.log('click from breakpoint in GdbComponents')
      fetchInfoBreakpoints()
    }
  }, [refresh])
  return (
    <div>
      {/* BreakPoints */}
      <div className="breakpoints">
        {infoBreakpointData
          ? infoBreakpointData
          : data?.length > 0
            ? data.map((obj) => {
                return (
                  <div>
                    <div>{obj.offset}</div>
                    <div>{obj.addr}</div>
                  </div>
                )
              })
            : infoBreakpointData}
        {}
      </div>
    </div>
  )
}

export default BreakPoints
