import { apiClient } from "./api-client";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "@/types/auth";
import type { WorkspaceUser } from "@/types/user";

export const TOKEN_STORAGE_KEY = "crm_access_token";
export const USER_STORAGE_KEY = "crm_user";
const COOKIE_TOKEN_KEY = "crm_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (fromLocal) return fromLocal;

  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_TOKEN_KEY}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export function setStoredToken(token: string, expiresIn: number = 86400): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  if (typeof document !== "undefined") {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isHttps ? "; Secure" : "";
    document.cookie = `${COOKIE_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${expiresIn}; SameSite=Lax${secureFlag}`;
  }
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  if (typeof document !== "undefined") {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isHttps ? "; Secure" : "";
    document.cookie = `${COOKIE_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  }
}

export function getStoredUser(): WorkspaceUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: WorkspaceUser): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export function clearStoredUser(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    const data = response.data;
    if (data?.accessToken) {
      setStoredToken(data.accessToken, data.expiresIn || 86400);
      if (data.user) {
        setStoredUser(data.user);
      }
    }
    return data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    const result = response.data;
    if (result?.accessToken) {
      setStoredToken(result.accessToken, result.expiresIn || 86400);
      if (result.user) {
        setStoredUser(result.user);
      }
    }
    return result;
  },

  async getProfile(): Promise<WorkspaceUser> {
    const response = await apiClient.get<WorkspaceUser>("/auth/me");
    const user = response.data;
    if (user) {
      setStoredUser(user);
    }
    return user;
  },

  logout(): void {
    clearStoredToken();
    clearStoredUser();
  },
};
