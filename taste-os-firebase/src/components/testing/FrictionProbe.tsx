"use client";

import { useEffect } from "react";
import { startFrictionProbe } from "@/lib/testing/friction";

/**
 * Mounts the friction probe (only active when NEXT_PUBLIC_EMOTIONAL_QA="1").
 * Renders nothing — it just listens, quietly, during QA sessions.
 */
export function FrictionProbe() {
  useEffect(() => {
    startFrictionProbe();
  }, []);
  return null;
}
