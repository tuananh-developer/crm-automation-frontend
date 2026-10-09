"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { getWorkspaceUsers } from "@/services/user.service";
import type { WorkspaceUser } from "@/types/user";

const STORAGE_KEY = "crm-flow.workspace-user-id";

const subscribe = () => () => {};

/**
 * The backend has no authentication, so the active workspace member is picked
 * in the UI and remembered in localStorage. `useSyncExternalStore` keeps the
 * stored value out of the server render pass.
 */
export function useWorkspaceUser() {
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
    users.find((user) => user.id === (selectedId ?? storedId)) ?? users[0] ?? null;

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
