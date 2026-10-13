/** Workspace member returned by `GET /users` (no passwordHash). */
export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES";
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Current authenticated user from JWT token (GET /auth/me). */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES";
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};