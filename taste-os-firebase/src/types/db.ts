import type { Modality, Tone } from "./atmosphere";

/** Firestore document shapes (under users/{uid}/...). */

export interface FragmentDoc {
  modality: Modality;
  emotionText: string;
  embedding: number[] | null; // Firestore vector value
  caption: string | null;
  tone: Tone | null;
  warmth: number | null;
  sourceRef: string | null; // Storage path
  salience: number;
  released: boolean;
  isLocalOnly: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface NarrationDoc {
  mode: string;
  text: string;
  evidence: string[];
  surface: string;
  dedupKey: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface ClusterDoc {
  themeKo: string;
  centroid: number[];
  tone: Tone;
  recurrence: number;
  memberCount: number;
  lastSeen: FirebaseFirestore.Timestamp;
}

export interface SnapshotDoc {
  periodStart: FirebaseFirestore.Timestamp;
  labelKo: string;
  warmth: number;
  centroid: number[];
}
