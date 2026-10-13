import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { mockLocalStorage } from '@/jest.setup';
import React from 'react';

jest.mock('@/services/auth.service');

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'SALES' as const,
  status: 'ACTIVE' as const,
  lastLoginAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.name ?? 'null'}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    mockLocalStorage.clear.mockReset();
  });

  it('provides auth context to children', () => {
    (authService.getStoredToken as jest.Mock).mockReturnValue(null);
    (authService.getStoredUser as jest.Mock).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('initializes with stored session', async () => {
    (authService.getStoredToken as jest.Mock).mockReturnValue('stored-token');
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
    (authService.getProfile as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('clears session when token is invalid', async () => {
    (authService.getStoredToken as jest.Mock).mockReturnValue('invalid-token');
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
    (authService.getProfile as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(authService.clearSession).toHaveBeenCalled();
  });

  it('login sets user and session', async () => {
    (authService.getStoredToken as jest.Mock).mockReturnValue(null);
    (authService.getStoredUser as jest.Mock).mockReturnValue(null);
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'new-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
      expect(authService.setSession).toHaveBeenCalledWith('new-token', mockUser);
    });
  });

  it('logout clears session and user', async () => {
    (authService.getStoredToken as jest.Mock).mockReturnValue('stored-token');
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
    (authService.getProfile as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(authService.clearSession).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });
});