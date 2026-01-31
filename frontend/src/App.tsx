import { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthGuard, GuestGuard, AppLayout } from './components';
import { Login, Register, Home, Contacts, Profile } from './pages';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchCurrentUser } from './store/authSlice';
import { getCyberpunkTheme, getLightTheme } from './theme';

function App() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${mode}`;
  }, [mode]);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  // Memoize theme config to avoid unnecessary re-renders
  const themeConfig = useMemo(() => {
    return mode === 'cyberpunk' ? getCyberpunkTheme() : getLightTheme();
  }, [mode]);

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
          <Route
            path="/register"
            element={
              <GuestGuard>
                <Register />
              </GuestGuard>
            }
          />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout>
                  <Home />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/contacts"
            element={
              <AuthGuard>
                <AppLayout>
                  <Contacts />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
