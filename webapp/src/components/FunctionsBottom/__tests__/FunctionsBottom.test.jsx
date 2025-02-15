import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FunctionsBottom from '../FunctionsBottom.jsx'

test('renders FunctionsBottom component with search input', () => {
  render(<FunctionsBottom />)

  // Assert the presence of the heading
  const headingElement = screen.getByText(/Search/i)
  expect(headingElement).toBeInTheDocument()

  const searchInput = screen.getByPlaceholderText('Search')
  expect(searchInput).toBeInTheDocument()
  expect(searchInput).toHaveAttribute('type', 'text')

  fireEvent.change(searchInput, { target: { value: 'kernel' } })

  expect(searchInput).toHaveValue('kernel')
})
