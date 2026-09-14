import React, { useState } from 'react';
import { getAllShortcuts } from '../../utils/keyboardShortcuts';
import './KeyboardShortcutsHelp.css';
import { MdClose } from 'react-icons/md';

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const shortcuts = getAllShortcuts();

  if (!isOpen) return null;

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            className="shortcuts-close-btn"
            onClick={onClose}
            aria-label="Close shortcuts help"
          >
            <MdClose size={24} />
          </button>
        </div>
        <div className="shortcuts-modal-content">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Command</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut) => (
                <tr key={shortcut.key}>
                  <td className="shortcut-key">
                    <kbd>{shortcut.key}</kbd>
                  </td>
                  <td className="shortcut-name">{shortcut.name}</td>
                  <td className="shortcut-description">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="shortcuts-modal-footer">
          <button className="shortcuts-close-btn-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
