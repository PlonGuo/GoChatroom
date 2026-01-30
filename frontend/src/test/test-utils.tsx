import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../store/authSlice'
import contactReducer from '../store/contactSlice'
import sessionReducer from '../store/sessionSlice'
import type { RootState } from '../store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    route = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  // Set the route
  window.history.pushState({}, 'Test page', route)

  // Create a new store for each test
  const store = configureStore({
    reducer: {
      auth: authReducer,
      contact: contactReducer,
      session: sessionReducer,
    },
    preloadedState: preloadedState as Parameters<typeof configureStore>[0]['preloadedState'],
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ConfigProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ConfigProvider>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithProviders as render }
