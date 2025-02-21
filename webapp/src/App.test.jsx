import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { DataProvider } from './context/DataContext' // Import the DataProvider

test('renders Footer component', () => {
  render(
    <MemoryRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  expect(
    screen.getByText(/Designed & Built with 💖 by Shubh Mehta/i),
  ).toBeInTheDocument()
})

test('renders Threads component within Debug route', () => {
  render(
    <MemoryRouter initialEntries={['/debug/threads']}>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  const threadsComponent = screen.getByText(/Threads/i)
  expect(threadsComponent).toBeInTheDocument()
  // Add any other checks specific to the Threads component
})

test('renders LocalVariable component within Debug route', () => {
  render(
    <MemoryRouter initialEntries={['/debug/localVariable']}>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  const localVariableComponent = screen.getByText(/Local Variable/i)
  expect(localVariableComponent).toBeInTheDocument()
  // Add any other checks specific to the LocalVariable component
})

test('renders Context component within Debug route', () => {
  render(
    <MemoryRouter initialEntries={['/debug/context']}>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  const contextComponent = screen.getByText(/Context/i)
  expect(contextComponent).toBeInTheDocument()
  // Add any other checks specific to the Context component
})

test('renders MemoryMap component within Debug route', () => {
  render(
    <MemoryRouter initialEntries={['/debug/memoryMap']}>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  const memoryMapComponent = screen.getByText(/Memory Map/i)
  expect(memoryMapComponent).toBeInTheDocument()
  // Add any other checks specific to the MemoryMap component
})

test('renders BreakPoints component within Debug route', () => {
  render(
    <MemoryRouter initialEntries={['/debug/breakPoints']}>
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  )
  const breakpointsComponent = screen.getByText(/Break Points/i)
  expect(breakpointsComponent).toBeInTheDocument()
  // Add any other checks specific to the BreakPoints component
})
