import { describe, it, expect } from 'vitest';
import {
  KEYBOARD_SHORTCUTS,
  getNormalizedKeyCombo,
  isShortcutPressed,
  getShortcutByCommand,
  getAllShortcuts,
} from '../keyboardShortcuts';

describe('keyboardShortcuts utility', () => {
  describe('getNormalizedKeyCombo', () => {
    it('should normalize single key press', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'A',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      });
      expect(getNormalizedKeyCombo(event)).toBe('A');
    });

    it('should normalize Ctrl+K combination', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      });
      expect(getNormalizedKeyCombo(event)).toBe('Ctrl+K');
    });

    it('should normalize Shift+F11 combination', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F11',
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      });
      expect(getNormalizedKeyCombo(event)).toBe('Shift+F11');
    });

    it('should normalize Alt+Ctrl+K combination', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
      });
      expect(getNormalizedKeyCombo(event)).toBe('Ctrl+Alt+K');
    });

    it('should handle space key', () => {
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      });
      expect(getNormalizedKeyCombo(event)).toBe('Space');
    });
  });

  describe('isShortcutPressed', () => {
    it('should return true when F5 is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F5',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      });
      expect(isShortcutPressed(event, 'F5')).toBe(true);
    });

    it('should return false when different key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F5',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      });
      expect(isShortcutPressed(event, 'F10')).toBe(false);
    });

    it('should correctly detect Ctrl+B shortcut', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      });
      expect(isShortcutPressed(event, 'Ctrl+B')).toBe(true);
    });

    it('should correctly detect Shift+F11 shortcut', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F11',
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      });
      expect(isShortcutPressed(event, 'Shift+F11')).toBe(true);
    });
  });

  describe('getShortcutByCommand', () => {
    it('should return F5 shortcut by command name', () => {
      const shortcut = getShortcutByCommand('continue');
      expect(shortcut).toEqual(KEYBOARD_SHORTCUTS.F5);
    });

    it('should return F10 shortcut by command name', () => {
      const shortcut = getShortcutByCommand('stepOver');
      expect(shortcut).toEqual(KEYBOARD_SHORTCUTS.F10);
    });

    it('should return null for unknown command', () => {
      const shortcut = getShortcutByCommand('unknownCommand');
      expect(shortcut).toBeNull();
    });
  });

  describe('getAllShortcuts', () => {
    it('should return array of all shortcuts', () => {
      const shortcuts = getAllShortcuts();
      expect(Array.isArray(shortcuts)).toBe(true);
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should contain all expected shortcuts', () => {
      const shortcuts = getAllShortcuts();
      const commands = shortcuts.map((s) => s.command);
      expect(commands).toContain('continue');
      expect(commands).toContain('stepOver');
      expect(commands).toContain('stepInto');
      expect(commands).toContain('stepOut');
      expect(commands).toContain('toggleBreakpoint');
      expect(commands).toContain('showShortcuts');
    });

    it('should have proper structure for each shortcut', () => {
      const shortcuts = getAllShortcuts();
      shortcuts.forEach((shortcut) => {
        expect(shortcut).toHaveProperty('key');
        expect(shortcut).toHaveProperty('name');
        expect(shortcut).toHaveProperty('description');
        expect(shortcut).toHaveProperty('command');
        expect(shortcut).toHaveProperty('gdbCommand');
      });
    });
  });

  describe('KEYBOARD_SHORTCUTS constant', () => {
    it('should have F5 shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS.F5).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.F5.gdbCommand).toBe('continue');
    });

    it('should have F10 shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS.F10).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.F10.gdbCommand).toBe('next');
    });

    it('should have F11 shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS.F11).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.F11.gdbCommand).toBe('step');
    });

    it('should have Shift+F11 shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS['Shift+F11']).toBeDefined();
      expect(KEYBOARD_SHORTCUTS['Shift+F11'].gdbCommand).toBe('finish');
    });

    it('should have Ctrl+B shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS['Ctrl+B']).toBeDefined();
      expect(KEYBOARD_SHORTCUTS['Ctrl+B'].command).toBe('toggleBreakpoint');
    });

    it('should have Ctrl+K shortcut defined', () => {
      expect(KEYBOARD_SHORTCUTS['Ctrl+K']).toBeDefined();
      expect(KEYBOARD_SHORTCUTS['Ctrl+K'].command).toBe('showShortcuts');
    });
  });
});
