"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { watchLatestReport } from "@/lib/firebase/services/reports";
import type { TasteReportDoc } from "@/lib/firebase/collections";

/** The user's latest Taste Report, live (it evolves with them). */
export function useLatestReport() {
  const { user } = useAuth();
  const [report, setReport] = useState<(TasteReportDoc & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = watchLatestReport(user.uid, (r) => {
      setReport(r);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { report, loading };
}
