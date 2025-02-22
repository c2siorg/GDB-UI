// main.jsx
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { TerminalContextProvider } from 'react-terminal'
import App from './App'
import './index.css'

ReactDOM.render(
  <BrowserRouter>
    <DataProvider>
      <TerminalContextProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </TerminalContextProvider>
    </DataProvider>
  </BrowserRouter>,
  document.getElementById('root'),
)
