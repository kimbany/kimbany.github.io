import { streamNarration } from "@/lib/openai/narration";
import { buildEvidence } from "@/server/actions/atmosphere";
import { verifyUid } from "@/lib/firebase/admin";
import type { RecallMode } from "@/types/atmosphere";

export const runtime = "nodejs";

/**
 * SSE streaming narration. The client sends its Firebase ID token; we verify
 * it to scope evidence to that user, build evidence from Firestore, then
 * stream gpt-4.1 tokens. The client reveals them with breath pacing.
 */
export async function POST(req: Request) {
  const { mode = "resonant", locale = "ko", idToken } = (await req.json()) as {
    mode?: RecallMode;
    locale?: string;
    idToken?: string;
  };

  const uid = await verifyUid(idToken);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const evidence = uid
          ? await buildEvidence(uid, mode)
          : { facts: "조용한 따뜻함이 곁에 머무름." };
        for await (const token of streamNarration(mode, evidence, locale)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`)); // graceful silence
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
