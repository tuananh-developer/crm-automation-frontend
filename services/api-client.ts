import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { authService } from "./auth.service";
import type { StandardApiResponse } from "@/types/api";

/**
 * Base URL of the NestJS backend.
 * Defaults to the local CRM backend; override with NEXT_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

/** Request interceptor - attach JWT token */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authService.getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Response interceptor - unwrap standard API response and handle 401 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap StandardApiResponse if present
    const responseData = response.data as StandardApiResponse<unknown> | undefined;
    if (responseData && typeof responseData === "object" && "success" in responseData && "data" in responseData) {
      // Return the unwrapped data for easier consumption
      response.data = responseData.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // For now, just clear session and redirect to login
      // In the future, implement refresh token logic here
      authService.clearSession();

      if (typeof window !== "undefined") {
        // Using window.location.href because this interceptor runs outside React component context
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/auth/login";
      }

      isRefreshing = false;
      processQueue(error, null);
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      // Don't auto-logout on 403, let the component handle it
      console.warn("Access forbidden:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

/** Normalised error message so every screen can render the same error state. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }

    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (!error.response) {
      return `Cannot reach the CRM backend at ${API_BASE_URL}.`;
    }

    return `Request failed with status ${error.response.status}.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

export { apiClient };