"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { startGuest, ensureUserDoc, signInWithGoogle, signOut } from "@/lib/firebase/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Holds the persistent Firebase session. On first visit it quietly starts a
 * guest (anonymous) session so the user can meet the atmosphere before deciding
 * to stay. Linking Google later keeps the same uid — emotional memory continues.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try {
          await startGuest(); // listener re-fires with the guest user
        } catch {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      void ensureUserDoc(u);
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthState = {
    user,
    loading,
    isGuest: !!user?.isAnonymous,
    signInWithGoogle: async () => {
      const u = await signInWithGoogle();
      setUser(u);
    },
    signOut: async () => {
      await signOut(); // listener will start a fresh guest session
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
