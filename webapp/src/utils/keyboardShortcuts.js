/**
 * Keyboard Shortcuts Utility for GDB-UI Debugger
 * Maps keyboard shortcuts to GDB debugging commands
 */

export const KEYBOARD_SHORTCUTS = {
  F5: {
    key: 'F5',
    name: 'Continue/Run',
    description: 'Continue or run the program',
    command: 'continue',
    gdbCommand: 'continue',
  },
  F10: {
    key: 'F10',
    name: 'Step Over',
    description: 'Execute the current line and stop at the next line',
    command: 'stepOver',
    gdbCommand: 'next',
  },
  F11: {
    key: 'F11',
    name: 'Step Into',
    description: 'Step into the current function',
    command: 'stepInto',
    gdbCommand: 'step',
  },
  'Shift+F11': {
    key: 'Shift+F11',
    name: 'Step Out',
    description: 'Execute until the current function returns',
    command: 'stepOut',
    gdbCommand: 'finish',
  },
  'Ctrl+B': {
    key: 'Ctrl+B',
    name: 'Toggle Breakpoint',
    description: 'Toggle breakpoint at current line',
    command: 'toggleBreakpoint',
    gdbCommand: null, // Handled separately
  },
  'Ctrl+K': {
    key: 'Ctrl+K',
    name: 'Show Shortcuts',
    description: 'Display keyboard shortcuts help',
    command: 'showShortcuts',
    gdbCommand: null, // Handled separately
  },
};

/**
 * Normalize key combination to a standard format
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {string} - Normalized key combination (e.g., "Ctrl+K")
 */
export const getNormalizedKeyCombo = (event) => {
  const keys = [];
  
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');
  
  const key = event.key === ' ' ? 'Space' : event.key.toUpperCase();
  
  if (!['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
    keys.push(key);
  }
  
  return keys.join('+');
};

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @param {string} shortcutKey - The shortcut key combination
 * @returns {boolean} - True if the event matches the shortcut
 */
export const isShortcutPressed = (event, shortcutKey) => {
  const normalized = getNormalizedKeyCombo(event);
  return normalized === shortcutKey;
};

/**
 * Get shortcut info by command name
 * @param {string} command - The command name
 * @returns {Object|null} - The shortcut object or null
 */
export const getShortcutByCommand = (command) => {
  return Object.values(KEYBOARD_SHORTCUTS).find(
    (shortcut) => shortcut.command === command
  ) || null;
};

/**
 * Get all shortcuts as an array
 * @returns {Array} - Array of all shortcuts
 */
export const getAllShortcuts = () => {
  return Object.values(KEYBOARD_SHORTCUTS);
};
