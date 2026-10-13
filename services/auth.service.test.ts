import { authService } from '@/services/auth.service';
import { apiClient } from '@/services/api-client';
import { mockLocalStorage } from '@/jest.setup';

jest.mock('@/services/api-client');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    mockLocalStorage.clear.mockReset();
  });

  describe('login', () => {
    it('calls apiClient.post with correct credentials', async () => {
      const mockResponse = {
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'SALES' as const,
          status: 'ACTIVE' as const,
          lastLoginAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('calls apiClient.post with correct credentials', async () => {
      const mockResponse = {
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'SALES' as const,
          status: 'ACTIVE' as const,
          lastLoginAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'SALES',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'SALES',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('calls apiClient.get with correct endpoint', async () => {
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

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('session management', () => {
    it('getStoredToken returns token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(authService.getStoredToken()).toBe('test-token');
    });

    it('getStoredToken returns null when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(authService.getStoredToken()).toBeNull();
    });

    it('setSession stores token and user', () => {
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SALES' as const,
        status: 'ACTIVE' as const,
        lastLoginAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      authService.setSession('test-token', user);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('crm_access_token', 'test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('crm_user', JSON.stringify(user));
    });

    it('clearSession removes token and user', () => {
      authService.clearSession();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('crm_access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('crm_user');
    });

    it('isAuthenticated returns true when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated returns false when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});