"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUser, getProfile, onAuthStateChange } from "@/lib/supabase-auth";
import { isAdminUser, type UserProfile } from "@/lib/auth-utils";

interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    async function loadAuth() {
      try {
        // getUser() valida la sesión contra el servidor (más seguro que getSession)
        const { data: { user } } = await getUser();
        if (user) {
          const profile = await getProfile(user.id);
          setState({
            user: { id: user.id, email: user.email ?? "" },
            profile: profile as UserProfile | null,
            isAdmin: isAdminUser(profile as UserProfile | null),
            isLoading: false,
          });
        } else {
          setState({ user: null, profile: null, isAdmin: false, isLoading: false });
        }
      } catch {
        setState({ user: null, profile: null, isAdmin: false, isLoading: false });
      }
    }

    loadAuth();

    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      const s = session as { user?: { id: string; email?: string } } | null;
      if (s?.user) {
        const profile = await getProfile(s.user.id);
        setState({
          user: { id: s.user.id, email: s.user.email ?? "" },
          profile: profile as UserProfile | null,
          isAdmin: isAdminUser(profile as UserProfile | null),
          isLoading: false,
        });
      } else {
        setState({ user: null, profile: null, isAdmin: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return React.createElement(AuthContext.Provider, { value: state }, children);
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
