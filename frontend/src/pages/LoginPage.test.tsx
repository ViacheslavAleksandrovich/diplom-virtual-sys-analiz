import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from './LoginPage';
import { AuthContext, AuthContextType } from '../store/authStore';

const createAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => undefined,
  register: async () => undefined,
  logout: async () => undefined,
  setUser: () => undefined,
  ...overrides,
});

describe('LoginPage', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthContext()}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Virtual Training Simulator')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  test('shows error when login fails', async () => {
    const login = jest.fn(async () => {
      throw new Error('invalid credentials');
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthContext({ login })}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Невірний email або пароль')).toBeTruthy();
    });
  });
});
