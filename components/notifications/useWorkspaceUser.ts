"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/AuthProvider";
import { getWorkspaceUsers } from "@/services/user.service";
import type { WorkspaceAssignee, WorkspaceUser } from "@/types/user";

const STORAGE_KEY = "crm-flow.workspace-user-id";

const subscribe = () => () => {};

/**
 * Sales users always use their own identity for inbox actions. Admins may
 * select another workspace member for administrative inbox review.
 */
export function useWorkspaceUser() {
  const { user: authUser } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["workspace-users"],
    queryFn: getWorkspaceUsers,
    enabled: Boolean(authUser),
  });

  const isHydrated = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const users = usersQuery.data ?? [];
  const storedId = isHydrated ? window.localStorage.getItem(STORAGE_KEY) : null;

  const selectedWorkspaceUser = users.find(
    (user) => user.id === (selectedId ?? storedId ?? authUser?.id),
  );
  const activeUser: WorkspaceUser | WorkspaceAssignee | null =
    authUser?.role === "ADMIN"
      ? selectedWorkspaceUser ?? authUser
      : authUser;

  const selectUser = React.useCallback((userId: string) => {
    setSelectedId(userId);
    window.localStorage.setItem(STORAGE_KEY, userId);
  }, []);

  return {
    users,
    activeUser,
    selectUser,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
  };
}
