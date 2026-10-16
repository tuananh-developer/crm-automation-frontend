"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/AuthProvider";
import { getWorkspaceUsers } from "@/services/user.service";
import type { WorkspaceUser } from "@/types/user";

const STORAGE_KEY = "crm-flow.workspace-user-id";

const subscribe = () => () => {};

/**
 * Resolves the active workspace member. Prioritizes the currently authenticated
 * user from AuthProvider, then explicit user override, stored localStorage ID,
 * and finally falls back to the first seeded workspace user.
 */
export function useWorkspaceUser() {
  const { user: authUser } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["workspace-users"],
    queryFn: getWorkspaceUsers,
  });

  const isHydrated = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const users = usersQuery.data ?? [];
  const storedId = isHydrated ? window.localStorage.getItem(STORAGE_KEY) : null;

  const activeUser: WorkspaceUser | null =
    users.find(
      (user) => user.id === (selectedId ?? authUser?.id ?? storedId),
    ) ??
    authUser ??
    users[0] ??
    null;

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
