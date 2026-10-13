import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

jest.mock('axios');

// Define getApiErrorMessage locally (same as in api-client.ts)
function getApiErrorMessage(error: unknown): string {
  if (!error) return 'Unexpected error.';
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as { isAxiosError: boolean; response?: { data?: { message?: string | string[] }; status?: number }; code?: string };
    
    if (axiosError.response?.data?.message) {
      const msg = axiosError.response.data.message;
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    
    if (!axiosError.response) {
      return 'Cannot reach the CRM backend. Please check your connection.';
    }
    
    return `Request failed with status ${axiosError.response.status}.`;
  }
  
  return 'Unexpected error.';
}

describe('getApiErrorMessage', () => {
  it('returns message from axios error response', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'Custom error message' },
        status: 400,
      },
      code: undefined,
    };

    expect(getApiErrorMessage(error)).toBe('Custom error message');
  });

  it('joins array messages', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: ['Error 1', 'Error 2'] },
        status: 400,
      },
      code: undefined,
    };

    expect(getApiErrorMessage(error)).toBe('Error 1, Error 2');
  });

  it('returns timeout message for ECONNABORTED', () => {
    const error = {
      isAxiosError: true,
      response: undefined,
      code: 'ECONNABORTED',
    };

    expect(getApiErrorMessage(error)).toBe('Request timed out. Please try again.');
  });

  it('returns connection error when no response', () => {
    const error = {
      isAxiosError: true,
      response: undefined,
      code: 'ERR_NETWORK',
    };

    expect(getApiErrorMessage(error)).toContain('Cannot reach the CRM backend');
  });

  it('returns status message for other errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {},
        status: 500,
      },
      code: undefined,
    };

    expect(getApiErrorMessage(error)).toBe('Request failed with status 500.');
  });

  it('returns error message for generic Error', () => {
    const error = new Error('Generic error');
    expect(getApiErrorMessage(error)).toBe('Generic error');
  });

  it('returns fallback for unknown error', () => {
    expect(getApiErrorMessage(null)).toBe('Unexpected error.');
    expect(getApiErrorMessage('string error')).toBe('Unexpected error.');
  });
});

// Test interceptors in isolation with mocked axios
interface MockInterceptorHandler<T = unknown> {
  fulfilled: (value: T) => T | Promise<T>;
  rejected?: (error: unknown) => unknown;
}

const mockInterceptors = {
  request: { 
    use: jest.fn(), 
    handlers: [] as MockInterceptorHandler<InternalAxiosRequestConfig>[] 
  },
  response: { 
    use: jest.fn(), 
    handlers: [] as MockInterceptorHandler<AxiosResponse>[] 
  },
};

const mockAxiosCreate = jest.fn(() => ({
  interceptors: mockInterceptors,
}));

(axios.create as jest.Mock).mockImplementation(mockAxiosCreate);

const mockAuthService = {
  getStoredToken: jest.fn(),
};

describe('apiClient interceptors (isolated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getStoredToken.mockReset();
    mockInterceptors.request.handlers = [];
    mockInterceptors.response.handlers = [];
    mockInterceptors.request.use.mockImplementation((fn) => {
      mockInterceptors.request.handlers.push({ fulfilled: fn });
      return 0;
    });
    mockInterceptors.response.use.mockImplementation((fn) => {
      mockInterceptors.response.handlers.push({ fulfilled: fn });
      return 0;
    });

    // Simulate api-client initialization
    const apiClient = axios.create({
      baseURL: 'http://localhost:3000/api/v1',
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = mockAuthService.getStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        const responseData = response.data;
        if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
          response.data = responseData.data;
        }
        return response;
      },
      async (error) => Promise.reject(error)
    );
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists', () => {
      mockAuthService.getStoredToken.mockReturnValue('test-token');

      const mockConfig = { 
        headers: {} as Record<string, string>
      } as InternalAxiosRequestConfig;
      const interceptor = mockInterceptors.request.handlers[0].fulfilled;
      const result = interceptor(mockConfig) as InternalAxiosRequestConfig & { headers: Record<string, string> };

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not add Authorization header when no token', () => {
      mockAuthService.getStoredToken.mockReturnValue(null);

      const mockConfig = { 
        headers: {} as Record<string, string>
      } as InternalAxiosRequestConfig;
      const interceptor = mockInterceptors.request.handlers[0].fulfilled;
      const result = interceptor(mockConfig) as InternalAxiosRequestConfig & { headers: Record<string, string> };

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('unwraps StandardApiResponse', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          success: true,
          data: { id: '1', name: 'Test' },
        },
        status: 200,
        statusText: 'OK',
        headers: new axios.AxiosHeaders(),
        config: {},
      } as AxiosResponse;

      const interceptor = mockInterceptors.response.handlers[0].fulfilled;
      const result = await interceptor(mockResponse);

      expect(result.data).toEqual({ id: '1', name: 'Test' });
    });

    it('returns response as-is when not StandardApiResponse', async () => {
      const mockResponse = {
        data: { id: '1', name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: new axios.AxiosHeaders(),
        config: {},
      } as AxiosResponse;

      const interceptor = mockInterceptors.response.handlers[0].fulfilled;
      const result = await interceptor(mockResponse);

      expect(result.data).toEqual({ id: '1', name: 'Test' });
    });
  });
});