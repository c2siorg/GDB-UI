import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GdbComponents from '../GdbComponents.jsx'

describe('GdbComponents', () => {
  test('renders all navigation links correctly', () => {
    render(
      <MemoryRouter>
        <GdbComponents />
      </MemoryRouter>,
    )

    // Assert the presence of all navigation links
    const threadsLink = screen.getByText(/Threads/i)
    const localVariableLink = screen.getByText(/Local Variable/i)
    const contextLink = screen.getByText(/Context/i)
    const memoryMapLink = screen.getByText(/Memory Map/i)
    const breakPointsLink = screen.getByText(/Break Points/i)

    expect(threadsLink).toBeInTheDocument()
    expect(localVariableLink).toBeInTheDocument()
    expect(contextLink).toBeInTheDocument()
    expect(memoryMapLink).toBeInTheDocument()
    expect(breakPointsLink).toBeInTheDocument()
  })

  test('clicking on navigation links updates active state', () => {
    render(
      <MemoryRouter>
        <GdbComponents />
      </MemoryRouter>,
    )

    // Click on a navigation link
    fireEvent.click(screen.getByText(/Memory Map/i))

    // Assert the active state is updated correctly
    const memoryMapLink = screen.getByText(/Memory Map/i)
    expect(memoryMapLink).toHaveClass('gdb-header-content active')

    // Ensure other links are not active
    const threadsLink = screen.getByText(/Threads/i)
    const localVariableLink = screen.getByText(/Local Variable/i)
    const contextLink = screen.getByText(/Context/i)
    const breakPointsLink = screen.getByText(/Break Points/i)

    expect(threadsLink).not.toHaveClass('gdb-header-content active')
    expect(localVariableLink).not.toHaveClass('gdb-header-content active')
    expect(contextLink).not.toHaveClass('gdb-header-content active')
    expect(breakPointsLink).not.toHaveClass('gdb-header-content active')
  })
})
