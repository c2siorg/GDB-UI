import React, { useContext } from 'react'
import { FaArrowLeft, FaArrowRight, FaForward, FaSquare } from 'react-icons/fa6'
import { IoReload } from 'react-icons/io5'
import { MdSkipNext, MdSkipPrevious } from 'react-icons/md'
import { BsArrowRightSquareFill } from 'react-icons/bs'
import { DataState } from '../../context/DataContext'
import axios from "axios";
import './DebugHeader.css'

const DebugHeader = () => {
  const {
    refresh,
    setRefresh,
    setTerminalOutput,
    setCommandPress,
    commandPress,
    textCode
  } = DataState();

  const handleSave = async (e) => {
    e.preventDefault();
    setRefresh(!refresh)
    try {
      const { data } = await axios.post("http://127.0.0.1:10000/compile", {
        code: textCode,
        name: "name",
      });
      console.log(data)
      return "success";
    } catch (error) {
      return "Failed to save File";
    }
  }

  const handleRun = (command) => {
    console.log('clicked')
    setCommandPress(!commandPress)
    setTerminalOutput(command)
  }

  return (
    <div className="parent-debug-header">
      <div className="debug-header">
        <div className="icons">
          <div className="arrow">
            <FaArrowLeft
              className="icon"
              title="Previous"
              onClick={() => {
                handleRun('previous')
              }}
            />
            <FaArrowRight
              className="icon"
              title="Next"
              onClick={() => {
                handleRun('next')
              }}
            />
          </div>
          <div className="others">
            <IoReload
              className="icon"
              title="Run"
              onClick={() => {
                handleRun('run')
              }}
            />
            <FaForward
              className="icon"
              title="Continue"
              onClick={() => {
                handleRun('continue')
              }}
            />
            <FaSquare
              className="icon"
              title="Stop"
              onClick={() => {
                handleRun('stop')
              }}
            />
            <MdSkipNext
              className="icon"
              title="Step"
              onClick={() => {
                handleRun('step')
              }}
            />
            <MdSkipPrevious
              className="icon"
              title="Finish"
              onClick={() => {
                handleRun('finish')
              }}
            />
            <BsArrowRightSquareFill
              className="icon"
              title="Run"
              onClick={() => {
                handleRun('step-out')
              }}
            />
          </div>
        </div>
        <div className="filename">
          <div className="filename-content">filename</div>
        </div>
        <div className="save">
          <button className="save-button" onClick={handleSave}>
            {refresh ? 'Saving..' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugHeader
