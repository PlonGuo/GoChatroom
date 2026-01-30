import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import contactReducer from './contactSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contact: contactReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
