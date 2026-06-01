"use client";

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import { useParallax } from "@/motion/useParallax";

type Tier = "cool" | "warming" | "warm" | "deep";

interface AtmosphereState {
  tier: Tier;
  warmth: number; // 0..1
  setTier: (t: Tier) => void;
  setWarmth: (w: number) => void;
}

const AtmosphereContext = createContext<AtmosphereState | null>(null);

/**
 * Holds the page's emotional atmosphere (tier + warmth) and applies it
 * to <body> as data attributes + a CSS var, so gradients/orbs across the
 * whole tree shift together — slowly. Also wires global cursor parallax.
 */
export function AtmosphereProvider({
  children,
  initialTier = "warming",
}: {
  children: ReactNode;
  initialTier?: Tier;
}) {
  const [tier, setTierState] = useState<Tier>(initialTier);
  const [warmth, setWarmthState] = useState(0.5);
  useParallax();

  const setTier = useCallback((t: Tier) => setTierState(t), []);
  const setWarmth = useCallback((w: number) => setWarmthState(Math.max(0, Math.min(1, w))), []);

  useEffect(() => {
    document.body.dataset.tier = tier;
    document.documentElement.style.setProperty("--atmosphere-warmth", String(warmth));
  }, [tier, warmth]);

  return (
    <AtmosphereContext.Provider value={{ tier, warmth, setTier, setWarmth }}>
      {children}
    </AtmosphereContext.Provider>
  );
}

export function useAtmosphere() {
  const ctx = useContext(AtmosphereContext);
  if (!ctx) throw new Error("useAtmosphere must be used within AtmosphereProvider");
  return ctx;
}
