import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test/test-utils'
import { Register } from './Register'

describe('Register', () => {
  it('renders registration form', () => {
    render(<Register />)

    expect(screen.getByText('GoChatroom')).toBeInTheDocument()
    expect(screen.getByText('Create a new account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nickname')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<Register />)

    const submitButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter your nickname')).toBeInTheDocument()
    })
  })

  it('validates nickname length', async () => {
    const user = userEvent.setup()
    render(<Register />)

    const nicknameInput = screen.getByPlaceholderText('Nickname')
    await user.type(nicknameInput, 'A')

    const submitButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Nickname must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('validates password match', async () => {
    const user = userEvent.setup()
    render(<Register />)

    const passwordInput = screen.getByPlaceholderText('Password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password')

    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different123')

    const submitButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('has link to login page', () => {
    render(<Register />)

    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
