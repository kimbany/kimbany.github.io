"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { watchTimeline } from "@/lib/firebase/services/timelines";
import { atmosphereTrajectory } from "@/lib/firebase/services/atmosphere";
import type { TimelineEventDoc, AtmosphereStateDoc } from "@/lib/firebase/collections";

/**
 * The cinematic emotional timeline: the atmosphere trajectory (seasons) plus
 * live timeline markers (shifts, recurrences). The Evolution Engine — warmth
 * shifts and atmosphere evolution — reads straight from these.
 */
export function useTimeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Array<TimelineEventDoc & { id: string }>>([]);
  const [trajectory, setTrajectory] = useState<Array<AtmosphereStateDoc & { id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    atmosphereTrajectory(user.uid).then((t) => alive && setTrajectory(t));
    const unsub = watchTimeline(user.uid, (e) => {
      setEvents(e);
      setLoading(false);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [user]);

  // warmth shift across the trajectory (the evolution engine's core signal)
  const warmthShift =
    trajectory.length >= 2
      ? (trajectory[trajectory.length - 1]!.warmth ?? 0) - (trajectory[0]!.warmth ?? 0)
      : 0;

  return { events, trajectory, warmthShift, loading };
}
