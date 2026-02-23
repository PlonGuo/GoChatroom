import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import contactReducer from './contactSlice';
import groupReducer from './groupSlice';
import sessionReducer from './sessionSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contact: contactReducer,
    group: groupReducer,
    session: sessionReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
