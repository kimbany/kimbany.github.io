"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { nostalgicMemories } from "@/lib/firebase/services/memories";
import type { MemoryDoc } from "@/lib/firebase/collections";

/**
 * Surfaces one quietly-returned memory from a while ago — a forgotten emotional
 * fragment. Never pushed; only here when you arrive. Returns null when there's
 * nothing old enough yet (a gentle absence, not an error).
 */
export function useNostalgicMemory() {
  const { user } = useAuth();
  const [memory, setMemory] = useState<(MemoryDoc & { id: string }) | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    nostalgicMemories(user.uid, 10, 6)
      .then((items) => {
        if (!alive || items.length === 0) return;
        // a soft, non-deterministic resurfacing
        setMemory(items[Math.floor(Math.random() * items.length)]!);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

  return memory;
}
