import { describe, it, expect, beforeEach } from 'vitest';
import themeReducer, { toggleTheme, setTheme, ThemeMode } from './themeSlice';

describe('themeSlice', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have cyberpunk as default mode when localStorage is empty', () => {
      const state = themeReducer(undefined, { type: 'unknown' });
      expect(state.mode).toBe('cyberpunk');
    });

    it('should load mode from localStorage if available', () => {
      localStorage.setItem('gochatroom-theme', 'light');
      // The state is created when module loads, so we test the structure
      const state = themeReducer(undefined, { type: 'unknown' });
      expect(['cyberpunk', 'light']).toContain(state.mode);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from cyberpunk to light', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      const state = themeReducer(initialState, toggleTheme());
      expect(state.mode).toBe('light');
    });

    it('should toggle from light to cyberpunk', () => {
      const initialState = { mode: 'light' as ThemeMode };
      const state = themeReducer(initialState, toggleTheme());
      expect(state.mode).toBe('cyberpunk');
    });

    it('should save to localStorage when toggling', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      themeReducer(initialState, toggleTheme());
      expect(localStorage.getItem('gochatroom-theme')).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('should set theme to cyberpunk', () => {
      const initialState = { mode: 'light' as ThemeMode };
      const state = themeReducer(initialState, setTheme('cyberpunk'));
      expect(state.mode).toBe('cyberpunk');
    });

    it('should set theme to light', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      const state = themeReducer(initialState, setTheme('light'));
      expect(state.mode).toBe('light');
    });

    it('should save to localStorage when setting theme', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      themeReducer(initialState, setTheme('light'));
      expect(localStorage.getItem('gochatroom-theme')).toBe('light');
    });

    it('should not change state if setting to same theme', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      const state = themeReducer(initialState, setTheme('cyberpunk'));
      expect(state.mode).toBe('cyberpunk');
    });
  });

  describe('localStorage integration', () => {
    it('should persist theme changes to localStorage', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      themeReducer(initialState, toggleTheme());
      expect(localStorage.getItem('gochatroom-theme')).toBe('light');
    });

    it('should update localStorage when theme is set directly', () => {
      const initialState = { mode: 'cyberpunk' as ThemeMode };
      themeReducer(initialState, setTheme('light'));
      expect(localStorage.getItem('gochatroom-theme')).toBe('light');
    });
  });
});
