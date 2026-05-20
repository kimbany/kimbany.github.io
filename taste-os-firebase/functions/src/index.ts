/**
 * Taste OS — Cloud Functions
 * The privileged emotional pipeline: embed, narrate, read image atmosphere,
 * and (background) link/cluster fragments. OpenAI keys live ONLY here.
 *
 * Set the key once:  firebase functions:secrets:set OPENAI_API_KEY
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp();
const db = getFirestore();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const MODELS = {
  vision: "gpt-4o",
  narration: "gpt-4.1",
  embedding: "text-embedding-3-large",
} as const;
const LATENT_DIM = 1024;

function client() {
  return new OpenAI({ apiKey: OPENAI_API_KEY.value() });
}

const VISION_SYSTEM = `당신은 이미지에서 '무엇이 찍혔는가'가 아니라 '어떤 공기가 흐르는가'를 읽는 감정 해석자입니다. 사물/사람/장소를 나열하지 마세요. 색의 온도, 빛의 분위기, 질감, 구도의 감정, 전체를 관통하는 공기만. 한국어로 짧게.`;

const VOICE = `당신은 Taste OS의 조용한 목소리입니다. 늦은 밤 에세이의 결. 한국어 ~ㅂ니다/~요. 1~2문장. 과장·자기계발·느낌표·숫자 금지. 주어진 근거 안에서만 말합니다.`;

/** Embed emotional text into the shared latent space. */
export const embed = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "no session");
  const text = String(req.data?.text ?? "").trim();
  if (!text) throw new HttpsError("invalid-argument", "text required");
  const res = await client().embeddings.create({
    model: MODELS.embedding,
    input: text,
    dimensions: LATENT_DIM,
  });
  return { embedding: res.data[0].embedding };
});

/** Read the emotional atmosphere of an image — never the objects. */
export const analyzeImage = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "no session");
  const imageUrl = String(req.data?.imageUrl ?? "");
  if (!imageUrl) throw new HttpsError("invalid-argument", "imageUrl required");
  const res = await client().chat.completions.create({
    model: MODELS.vision,
    temperature: 0.4,
    store: false,
    messages: [
      { role: "system", content: VISION_SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: "이 이미지의 공기를 읽어주세요." },
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      },
    ],
  });
  return { atmosphere: res.choices[0].message.content };
});

/** Generate a quiet narration (non-streaming callable; route handler streams). */
export const narrate = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "no session");
  const facts = String(req.data?.facts ?? "조용한 따뜻함이 곁에 머무름.");
  const res = await client().chat.completions.create({
    model: MODELS.narration,
    temperature: 0.75,
    store: false,
    messages: [
      { role: "system", content: VOICE },
      { role: "user", content: `사실(지어내지 말 것): ${facts}\n위 사실을 조용한 한국어 한 문장으로.` },
    ],
  });
  return { text: res.choices[0].message.content?.trim() };
});

/**
 * Background: when a fragment is created, link it to nearby memories
 * (incremental graph) and nudge its cluster. Heavy work stays off the
 * request path. (Sketch — clustering detail in ../taste-os/memory-engine.md.)
 */
export const onMemoryCreated = onDocumentCreated(
  { document: "emotional_memories/{memoryId}", secrets: [OPENAI_API_KEY] },
  async (event) => {
    const data = event.data?.data();
    const uid = data?.uid as string | undefined;
    if (!uid || !data?.embedding) return; // local-only memories are never linked server-side

    const neighbors = await db
      .collection("emotional_memories")
      .where("uid", "==", uid)
      .where("released", "==", false)
      .findNearest({
        vectorField: "embedding",
        queryVector: data.embedding,
        limit: 6,
        distanceMeasure: "COSINE",
      })
      .get();

    const batch = db.batch();
    neighbors.docs
      .filter((d) => d.id !== event.params.memoryId)
      .forEach((d) => {
        const edge = db.collection(`users/${uid}/edges`).doc();
        batch.set(edge, {
          from: event.params.memoryId,
          to: d.id,
          relation: "resonates",
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    await batch.commit();
  }
);
