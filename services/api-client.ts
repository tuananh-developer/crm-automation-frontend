import axios from "axios";

/**
 * Base URL of the NestJS backend.
 * Defaults to the local CRM backend; override with NEXT_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Attach Authorization Bearer token to all outgoing API requests
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )crm_access_token=([^;]*)/);
      const cookieToken = match ? decodeURIComponent(match[1]) : null;
      const token = window.localStorage.getItem("crm_access_token") || cookieToken;

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Intercept 401 Unauthorized responses to clear expired credentials
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      const url = error.config?.url ?? "";
      // Only clear and redirect if this was not an attempted login or register call
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        window.localStorage.removeItem("crm_access_token");
        window.localStorage.removeItem("crm_user");
        const isHttps = window.location.protocol === "https:";
        const secureFlag = isHttps ? "; Secure" : "";
        document.cookie = `crm_access_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
      }
    }
    return Promise.reject(error);
  },
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