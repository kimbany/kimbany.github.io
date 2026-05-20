"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { startAnonymous } from "@/lib/firebase/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

/**
 * Holds the Firebase auth session. On first visit, quietly starts an
 * anonymous session so the user can meet the atmosphere before deciding
 * to stay — the uid is preserved when they later link an identity.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try {
          await startAnonymous();
          return; // listener fires again with the anon user
        } catch {
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
