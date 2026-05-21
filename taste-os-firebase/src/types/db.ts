/**
 * Firestore document shapes — the canonical definitions live in
 * lib/firebase/collections.ts (so client + server share one source).
 */
export {
  COLLECTIONS,
  type Tone,
  type Modality,
  type UserDoc,
  type MemoryDoc,
  type AtmosphereStateDoc,
  type TasteReportDoc,
  type TimelineEventDoc,
  type NarrationDoc,
} from "@/lib/firebase/collections";
