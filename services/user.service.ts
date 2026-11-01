import { apiClient } from "./api-client";
import type { WorkspaceAssignee, WorkspaceUser } from "@/types/user";

export type ManagedUser = WorkspaceUser;
export type UserRole = "ADMIN" | "SALES";
export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export interface CreateManagedUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateManagedUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

function unwrapUsers(body: WorkspaceUser[] | { data?: WorkspaceUser[] }): WorkspaceUser[] {
  return Array.isArray(body) ? body : body.data ?? [];
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const { data } = await apiClient.get<WorkspaceUser[] | { data?: WorkspaceUser[] }>("/users");
  return unwrapUsers(data);
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  const { data } = await apiClient.post<ManagedUser | { data: ManagedUser }>("/users", input);
  return "data" in data ? data.data : data;
}

export async function updateManagedUser(userId: string, input: UpdateManagedUserInput): Promise<ManagedUser> {
  const { data } = await apiClient.patch<ManagedUser | { data: ManagedUser }>(`/users/${encodeURIComponent(userId)}`, input);
  return "data" in data ? data.data : data;
}

export async function disableManagedUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${encodeURIComponent(userId)}/disable`);
}

/** Minimal active-user directory for authenticated assignment flows. */
export async function getWorkspaceUsers(): Promise<WorkspaceAssignee[]> {
  const { data } = await apiClient.get<WorkspaceAssignee[] | { data?: WorkspaceAssignee[] }>(
    "/users/assignees",
  );
  return Array.isArray(data) ? data : data.data ?? [];
}
