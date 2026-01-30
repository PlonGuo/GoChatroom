import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { render } from '../../test/test-utils';

describe('ThemeToggle', () => {
  it('should render the toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show BulbFilled icon in cyberpunk mode', () => {
    render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'cyberpunk' },
      },
    });
    
    const button = screen.getByRole('button');
    expect(button.querySelector('[data-icon="bulb"]')).toBeInTheDocument();
  });

  it('should show BulbOutlined icon in light mode', () => {
    render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'light' },
      },
    });
    
    const button = screen.getByRole('button');
    expect(button.querySelector('[data-icon="bulb"]')).toBeInTheDocument();
  });

  it('should have cyan color in cyberpunk mode', () => {
    render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'cyberpunk' },
      },
    });
    
    const button = screen.getByRole('button');
    const icon = button.querySelector('span[role="img"]');
    expect(icon).toHaveStyle({ color: '#00f0ff' });
  });

  it('should have blue color in light mode', () => {
    render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'light' },
      },
    });
    
    const button = screen.getByRole('button');
    const icon = button.querySelector('span[role="img"]');
    expect(icon).toHaveStyle({ color: '#1677ff' });
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    const { store } = render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'cyberpunk' },
      },
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(store.getState().theme.mode).toBe('light');
  });

  it('should toggle from light to cyberpunk when clicked', async () => {
    const user = userEvent.setup();
    const { store } = render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'light' },
      },
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(store.getState().theme.mode).toBe('cyberpunk');
  });

  it('should persist theme to localStorage when toggled', async () => {
    const user = userEvent.setup();
    
    render(<ThemeToggle />, {
      preloadedState: {
        theme: { mode: 'cyberpunk' },
      },
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(localStorage.getItem('gochatroom-theme')).toBe('light');
  });
});
