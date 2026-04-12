"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, getProfile, onAuthStateChange } from "@/lib/supabase-auth";
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
        const { data: { session } } = await getSession();
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setState({
            user: { id: session.user.id, email: session.user.email || "" },
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

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setState({
          user: { id: session.user.id, email: session.user.email || "" },
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
