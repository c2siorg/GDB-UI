import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '../Footer.jsx'

describe('Footer Component', () => {
  test('renders Footer component with correct text content', () => {
    render(<Footer />)

    const footerText = screen.getByText(
      /Designed & Built with 💖 by Shubh Mehta/i,
    )
    expect(footerText).toBeInTheDocument()
  })
})
