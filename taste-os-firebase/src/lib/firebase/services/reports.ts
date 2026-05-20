"use client";

import {
  addDoc,
  collection,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../client";
import { COLLECTIONS, type TasteReportDoc } from "../collections";

const col = () => collection(db, COLLECTIONS.reports);

/** The most recent Taste Report (the latest portrait of the self). */
export async function latestReport(uid: string) {
  const q = query(
    col(),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    qLimit(1)
  );
  const snap = await getDocs(q);
  const d = snap.docs[0];
  return d ? { id: d.id, ...(d.data() as TasteReportDoc) } : null;
}

export async function saveReport(r: Omit<TasteReportDoc, "createdAt">) {
  const ref = await addDoc(col(), { ...r, createdAt: serverTimestamp() });
  return ref.id;
}
