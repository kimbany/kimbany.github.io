"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { watchUserDoc } from "@/lib/firebase/services/users";
import type { UserDoc } from "@/lib/firebase/collections";

/** The current user's profile doc (consent, name), live. */
export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(authLoading);
      return;
    }
    const unsub = watchUserDoc(user.uid, (u) => {
      setProfile(u);
      setLoading(false);
    });
    return () => unsub();
  }, [user, authLoading]);

  return { user, profile, loading };
}
