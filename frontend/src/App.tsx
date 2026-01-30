import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthGuard, GuestGuard, AppLayout } from './components';
import { Login, Register, Home, Contacts, Profile } from './pages';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchCurrentUser } from './store/authSlice';

function App() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
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
    </ConfigProvider>
  );
}

export default App;
