"use client";

import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../client";
import { COLLECTIONS, type TimelineEventDoc } from "../collections";

const col = () => collection(db, COLLECTIONS.timelines);

/** The seasons a self has passed through, oldest → newest. */
export async function listTimeline(uid: string) {
  const q = query(col(), where("uid", "==", uid), orderBy("occurredAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimelineEventDoc) }));
}

export function watchTimeline(
  uid: string,
  cb: (items: Array<TimelineEventDoc & { id: string }>) => void
) {
  const q = query(col(), where("uid", "==", uid), orderBy("occurredAt", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimelineEventDoc) })))
  );
}
