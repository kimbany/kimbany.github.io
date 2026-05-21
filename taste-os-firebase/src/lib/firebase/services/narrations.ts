"use client";

import {
  collection,
  getDocs,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../client";
import { COLLECTIONS, type NarrationDoc } from "../collections";

const col = () => collection(db, COLLECTIONS.narrations);

/** Narrations the user has been shown, newest first (writes happen server-side). */
export async function recentNarrations(uid: string, max = 5) {
  const q = query(
    col(),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as NarrationDoc) }));
}

export function watchRecentNarrations(
  uid: string,
  cb: (items: Array<NarrationDoc & { id: string }>) => void,
  max = 10
) {
  const q = query(
    col(),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as NarrationDoc) })))
  );
}
