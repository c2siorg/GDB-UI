import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp Component', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <KeyboardShortcutsHelp isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should display all shortcuts in table', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Continue/Run')).toBeInTheDocument();
    expect(screen.getByText('Step Over')).toBeInTheDocument();
    expect(screen.getByText('Step Into')).toBeInTheDocument();
    expect(screen.getByText('Step Out')).toBeInTheDocument();
    expect(screen.getByText('Toggle Breakpoint')).toBeInTheDocument();
    expect(screen.getByText('Show Shortcuts')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when footer close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
    
    const overlay = screen.getByText('Keyboard Shortcuts').parentElement?.parentElement;
    if (overlay?.parentElement) {
      fireEvent.click(overlay.parentElement);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not close modal when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
    
    const modalContent = screen.getByText('Keyboard Shortcuts').parentElement?.parentElement;
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should display keyboard shortcut keys in kbd elements', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />);
    
    const kbdElements = screen.getAllByRole('cell').filter(cell => 
      cell.querySelector('kbd') !== null
    );
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('should have proper table structure with headers', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Shortcut')).toBeInTheDocument();
    expect(screen.getByText('Command')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should display descriptions for each shortcut', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Continue or run the program')).toBeInTheDocument();
    expect(screen.getByText('Execute the current line and stop at the next line')).toBeInTheDocument();
    expect(screen.getByText('Step into the current function')).toBeInTheDocument();
  });
});
