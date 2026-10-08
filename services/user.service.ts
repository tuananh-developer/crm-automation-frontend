import { apiClient } from "./api-client";
import type { WorkspaceUser } from "@/types/user";

/**
 * Workspace members - backend endpoint GET /users (NestJS UsersController).
 * Used to pick whose review inbox / notification inbox is being viewed,
 * because the API has no authentication yet.
 */
export async function getWorkspaceUsers(): Promise<WorkspaceUser[]> {
  const response = await apiClient.get<WorkspaceUser[]>("/users");
  const body = response.data as WorkspaceUser[] | { data?: WorkspaceUser[] };

  if (Array.isArray(body)) return body;

  return body?.data ?? [];
}
