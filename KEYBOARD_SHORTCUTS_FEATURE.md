# Keyboard Shortcuts Feature

## Overview

The Keyboard Shortcuts feature provides developers with quick access to common debugging operations without needing to use the mouse. This implementation follows standard IDE conventions for debugging shortcuts.

## Shortcuts Available

### Primary Debugging Shortcuts

| Shortcut | Command | Description |
|----------|---------|-------------|
| **F5** | Continue/Run | Continue or run the program from the current breakpoint |
| **F10** | Step Over | Execute the current line and move to the next line in the current function |
| **F11** | Step Into | Step into the current function or method |
| **Shift+F11** | Step Out | Execute until the current function returns to the caller |
| **Ctrl+B** | Toggle Breakpoint | Toggle breakpoint at the current line (implementation pending) |
| **Ctrl+K** | Show Shortcuts | Display this keyboard shortcuts help panel |

## Features

- **Visual Help Panel**: Press `Ctrl+K` to display an interactive help panel with all available shortcuts
- **Non-Intrusive**: Keyboard shortcuts don't interfere with text input in form fields
- **Accessible Modal**: Keyboard shortcuts help can be dismissed by pressing `Escape` or clicking the close button
- **Light/Dark Theme Support**: The help panel respects the application's theme settings
- **Standard Conventions**: Uses familiar shortcuts from popular IDEs (VS Code, Visual Studio, etc.)

## Usage

### Basic Usage

1. Navigate to the Debug page
2. Use any of the keyboard shortcuts listed above to control the debugger
3. Press `Ctrl+K` to view all available shortcuts

### Examples

- **Start Debugging**: Press `F5` to run or continue the program
- **Debug Step-by-Step**: Use `F11` to step into functions and `F10` to step over
- **Exit Function**: Press `Shift+F11` when you want to return from the current function
- **Quick Reference**: Press `Ctrl+K` anytime to see the shortcuts help

## Implementation Details

### File Structure

```
webapp/src/
├── utils/
│   ├── keyboardShortcuts.js           # Core utility functions
│   └── keyboardShortcuts.test.js      # Unit tests for utilities
├── components/
│   └── KeyboardShortcutsHelp/
│       ├── KeyboardShortcutsHelp.jsx  # Help panel component
│       ├── KeyboardShortcutsHelp.css  # Component styles
│       └── __tests__/
│           └── KeyboardShortcutsHelp.test.jsx  # Component tests
└── pages/
    └── Debug/
        └── Debug.jsx                  # Enhanced with keyboard handlers
```

### Utility Functions

#### `KEYBOARD_SHORTCUTS` Constant
Defines all available keyboard shortcuts with metadata including:
- `key`: The keyboard combination string
- `name`: Human-readable name
- `description`: What the shortcut does
- `command`: Internal command identifier
- `gdbCommand`: The actual GDB command to execute

#### `getNormalizedKeyCombo(event)`
Converts a `KeyboardEvent` into a normalized string format (e.g., "Ctrl+K", "Shift+F11")

#### `isShortcutPressed(event, shortcutKey)`
Checks if a keyboard event matches a specific shortcut

#### `getShortcutByCommand(command)`
Retrieves shortcut information by command name

#### `getAllShortcuts()`
Returns an array of all available shortcuts

### Component Integration

The `Debug` component handles keyboard events:

1. Listens for all keyboard events on the window
2. Skips processing if the user is typing in input fields
3. Prevents default browser behavior for debug shortcuts
4. Executes the appropriate action based on the shortcut pressed

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **Utility Functions**: Full coverage of keyboard shortcut detection and normalization
- **Component**: Modal display, closing behavior, and content rendering
- **Integration**: Keyboard event handling in the Debug page

## Future Enhancements

### Planned Features

1. **Customizable Shortcuts**: Allow users to customize keyboard bindings
2. **Breakpoint Management**: Fully implement `Ctrl+B` for toggle breakpoint
3. **Settings Panel**: Add shortcuts configuration in user settings
4. **Platform-Specific**: Adapt shortcuts for different operating systems (e.g., Cmd on Mac)
5. **Command Palette**: Add a command palette (e.g., `Ctrl+Shift+P`) to search and execute commands

### Potential Additional Shortcuts

- `Ctrl+Shift+B`: Disable all breakpoints
- `Ctrl+Shift+C`: Clear all breakpoints
- `F9`: Evaluate expression
- `Ctrl+Alt+I`: Open immediate window
- `Ctrl+Alt+W`: Open watch window

## Browser Compatibility

The feature uses standard `KeyboardEvent` APIs and should work across all modern browsers:
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Accessibility

- Keyboard shortcuts are fully discoverable through the help panel
- Modal is keyboard-accessible and can be closed with `Escape`
- All buttons have proper ARIA labels
- High contrast support for different themes

## Performance

- Minimal overhead: Simple string comparison for shortcut detection
- No impact on existing features
- Help panel is rendered on-demand only

## Troubleshooting

### Shortcuts Not Working

1. **Check Focus**: Ensure the Debug page has focus (click on it first)
2. **Check Input Fields**: Shortcuts are disabled when typing in form fields
3. **Browser Conflicts**: Some browser extensions may intercept shortcuts
4. **Browser Settings**: Check if your browser has disabled keyboard input

### Modal Not Appearing

1. Verify you're on the Debug page
2. Check that `Ctrl+K` is not intercepted by your system or browser
3. Try clicking on the debug area and pressing `Ctrl+K` again

## Contributing

To add new shortcuts or modify existing ones:

1. Update `KEYBOARD_SHORTCUTS` constant in `webapp/src/utils/keyboardShortcuts.js`
2. Add corresponding handler in `Debug.jsx`
3. Add test cases in both test files
4. Update this documentation with the new shortcuts

## Related Issues & PRs

- PR #187: Keyboard Shortcuts for Debugging (This Feature)
- Issue: [(Link to corresponding issue)](https://github.com/c2siorg/GDB-UI/issues)

## References

- [MDN KeyboardEvent Documentation](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [VS Code Keyboard Shortcuts](https://code.visualstudio.com/docs/editor/debugging)
- [GDB Command Reference](https://sourceware.org/gdb/current/onlinedocs/gdb/Commands.html)
