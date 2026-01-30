import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'cyberpunk' | 'light';

interface ThemeState {
  mode: ThemeMode;
}

const THEME_STORAGE_KEY = 'gochatroom-theme';

const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as ThemeMode) || 'cyberpunk'; // Default to cyberpunk
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem(THEME_STORAGE_KEY, action.payload);
    },
    toggleTheme: (state) => {
      const newMode = state.mode === 'cyberpunk' ? 'light' : 'cyberpunk';
      state.mode = newMode;
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
