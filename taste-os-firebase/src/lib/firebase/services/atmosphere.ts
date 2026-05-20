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
import { COLLECTIONS, type AtmosphereStateDoc } from "../collections";

const col = () => collection(db, COLLECTIONS.atmosphere);

/** The live atmosphere (current === true). */
export function watchCurrentAtmosphere(
  uid: string,
  cb: (a: (AtmosphereStateDoc & { id: string }) | null) => void
) {
  const q = query(col(), where("uid", "==", uid), where("current", "==", true), qLimit(1));
  return onSnapshot(q, (snap) => {
    const d = snap.docs[0];
    cb(d ? { id: d.id, ...(d.data() as AtmosphereStateDoc) } : null);
  });
}

/** The trajectory of inner air over time → evolution/ seasons. */
export async function atmosphereTrajectory(uid: string) {
  const q = query(col(), where("uid", "==", uid), orderBy("periodStart", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AtmosphereStateDoc) }));
}
