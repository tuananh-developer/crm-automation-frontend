import { apiClient } from "./api-client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";
import type { CurrentUser } from "@/types/user";

const TOKEN_KEY = "crm_access_token";
const USER_KEY = "crm_user";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
    return data;
  },

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", credentials);
    return data;
  },

  async getProfile(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>("/auth/me");
    return data;
  },

  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser(): CurrentUser | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: CurrentUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};