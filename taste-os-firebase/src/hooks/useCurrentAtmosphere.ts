"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { watchCurrentAtmosphere } from "@/lib/firebase/services/atmosphere";
import { useAtmosphere } from "@/components/providers/AtmosphereProvider";
import type { AtmosphereStateDoc } from "@/lib/firebase/collections";

/**
 * The live atmosphere state, and a side-effect that lets the *visual*
 * atmosphere (gradients/orbs) follow the user's actual warmth.
 */
export function useCurrentAtmosphere() {
  const { user } = useAuth();
  const { setWarmth, setTier } = useAtmosphere();
  const [state, setState] = useState<(AtmosphereStateDoc & { id: string }) | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchCurrentAtmosphere(user.uid, (a) => {
      setState(a);
      if (a) {
        setWarmth(a.warmth);
        setTier(a.warmth < 0.3 ? "cool" : a.warmth < 0.55 ? "warming" : a.warmth < 0.8 ? "warm" : "deep");
      }
    });
    return () => unsub();
  }, [user, setWarmth, setTier]);

  return state;
}
