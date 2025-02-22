import React, { useState, useEffect, useRef } from 'react'
import { ReactTerminal } from 'react-terminal'
import axios from 'axios'
import './Terminal.css'
import { DataState } from '../../context/DataContext'

const TerminalComp = () => {
  const { terminalOutput, commandPress } = DataState()
  const [output, setOutput] = useState('')
  const terminalRef = useRef('null')

  const handleCommand = async (command, ...args) => {
    const fullCommand = [command, ...args].join(' ')
    console.log('Full Command:', fullCommand)
    try {
      const { data } = await axios.post('http://127.0.0.1:10000/gdb_command', {
        command: fullCommand,

        name: 'program',
      })
      return data['result']

    } catch (error) {
      return 'Error executing command'
    }
  }

  const defaultHandler = async (command, ...args) => {
    const result = await handleCommand(command, ...args)
    setOutput(result)
    return result
  }

  useEffect(() => {
    console.log(terminalOutput)
    if (terminalOutput) {
      console.log(terminalOutput)
      defaultHandler(terminalOutput)
    }
  }, [commandPress])

  return (
    <div className="terminal">
      <ReactTerminal
        ref={terminalRef}
        themes={{
          'my-custom-theme': {
            themeBGColor: '#000',
            themeToolbarColor: '#000',
            themeColor: '#00FF00',
            themePromptColor: '#a917a8',
          },
        }}
        theme="my-custom-theme"
        defaultHandler={defaultHandler}
      />
    </div>
  )
}

export default TerminalComp
