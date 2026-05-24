"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@/types/database.types";

type UserContextValue = {
  user: User | null;
  setUser: (next: User | null) => void;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

/**
 * Wraps the app so client components can read the authenticated user
 * synchronously on first render. The server layout fetches the user and
 * passes it in as `initialUser`, eliminating the brief "logged out → logged
 * in" flash that happens when a client component fetches its own auth state.
 */
export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user, setUserState] = useState<User | null>(initialUser);

  // Stable setter so consumers can use it in deps arrays safely.
  const setUser = useCallback((next: User | null) => {
    setUserState(next);
  }, []);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
