"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { watchMemories } from "@/lib/firebase/services/memories";
import type { MemoryDoc } from "@/lib/firebase/collections";

/** Live stream of the user's drifting memories. */
export function useEmotionalMemories(max = 30) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Array<MemoryDoc & { id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = watchMemories(
      user.uid,
      (items) => {
        setMemories(items);
        setLoading(false);
      },
      max
    );
    return () => unsub();
  }, [user, max]);

  return { memories, loading };
}
