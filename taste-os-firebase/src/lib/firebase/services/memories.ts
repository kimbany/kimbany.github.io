"use client";

import {
  addDoc,
  collection,
  doc,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  vector,
  getDocs,
  deleteField,
} from "firebase/firestore";
import { db } from "../client";
import { COLLECTIONS, type MemoryDoc, type Modality, type Tone } from "../collections";

const col = () => collection(db, COLLECTIONS.memories);

export interface NewMemory {
  uid: string;
  modality: Modality;
  emotionText: string;
  embedding?: number[] | null; // null/undefined → local-only
  caption?: string;
  tone?: Tone;
  warmth?: number;
  storagePath?: string;
}

/** Save a fragment of feeling. The embedding (if any) is a Firestore vector. */
export async function addMemory(m: NewMemory): Promise<string> {
  const ref = await addDoc(col(), {
    uid: m.uid,
    modality: m.modality,
    emotionText: m.emotionText,
    caption: m.caption ?? null,
    tone: m.tone ?? null,
    warmth: m.warmth ?? null,
    storagePath: m.storagePath ?? null,
    embedding: m.embedding ? vector(m.embedding) : null,
    salience: 0.5,
    released: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** A page of the user's memories (most recent first). */
export async function listMemories(uid: string, max = 30) {
  const q = query(
    col(),
    where("uid", "==", uid),
    where("released", "==", false),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MemoryDoc) }));
}

/** Live drift of memories for home/ and daily/. */
export function watchMemories(
  uid: string,
  cb: (items: Array<MemoryDoc & { id: string }>) => void,
  max = 30
) {
  const q = query(
    col(),
    where("uid", "==", uid),
    where("released", "==", false),
    orderBy("createdAt", "desc"),
    qLimit(max)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as MemoryDoc) })))
  );
}

/** Right to be forgotten — a memory is let go, removed from recall. */
export async function releaseMemory(id: string) {
  await updateDoc(doc(db, COLLECTIONS.memories, id), {
    released: true,
    embedding: deleteField(),
    releasedAt: serverTimestamp(),
  });
}
