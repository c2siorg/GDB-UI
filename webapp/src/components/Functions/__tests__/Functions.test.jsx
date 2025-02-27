import React from 'react'
import { render, screen } from '@testing-library/react'
import Functions from '../Functions.jsx'
import { vi } from 'vitest'

vi.mock('../../../context/DataContext.jsx', () => ({
  DataState: () => ({
    refresh: false,
    functions: [],
    setFunctions: vi.fn(),
  }),
}))

test('renders Functions component with correct heading', () => {
  render(<Functions />)

  const headingElement = screen.getByText(/Functions/i)
  expect(headingElement).toBeInTheDocument()

  const functionElements = screen.queryAllByRole('link')
  expect(functionElements).toHaveLength(0)
})
