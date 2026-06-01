import { streamNarrationFor } from "@/lib/ai/narrationPipeline";
import { streamNarration } from "@/lib/openai/narration";
import { verifyUid } from "@/lib/firebase/admin";
import { rateLimit, rateKey } from "@/lib/server/rateLimit";
import type { RecallMode } from "@/types/atmosphere";

export const runtime = "nodejs";

/**
 * SSE streaming narration. The client sends its Firebase ID token; we verify
 * it to scope evidence + persistence to that user, then stream gpt-4.1 tokens.
 * The client reveals them with breath pacing. A signed-out request still gets
 * a gentle, generic line (graceful, never an error).
 */
export async function POST(req: Request) {
  const { mode = "resonant", surface = "home", locale = "ko", idToken } =
    (await req.json()) as {
      mode?: RecallMode;
      surface?: string;
      locale?: string;
      idToken?: string;
    };

  const uid = await verifyUid(idToken);

  // gentle protection for the OpenAI budget (20 narrations / minute / user)
  const limited = rateLimit(rateKey(req, uid), 20, 60_000);
  if (!limited.ok) {
    return new Response(JSON.stringify({ error: "too_many_requests" }), {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfter), "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (token: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
      try {
        if (uid) {
          for await (const token of streamNarrationFor({ uid, mode, surface, locale })) {
            send(token);
          }
        } else {
          for await (const token of streamNarration(mode, { facts: "조용한 따뜻함이 곁에 머무름." }, locale)) {
            send(token);
          }
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
