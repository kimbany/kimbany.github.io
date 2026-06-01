import { streamNarration } from "@/lib/openai/narration";
import { buildEvidence } from "@/server/actions/atmosphere";
import type { RecallMode } from "@/types/atmosphere";

export const runtime = "nodejs";

/**
 * SSE streaming narration endpoint.
 * The client reads tokens and reveals them with breath pacing
 * (see Narration.tsx + narration.md §8) — generation is fast,
 * but the words bloom slowly.
 */
export async function POST(req: Request) {
  const { mode = "resonant", locale = "ko" } = (await req.json()) as {
    mode?: RecallMode;
    locale?: string;
  };

  const evidence = await buildEvidence(mode);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamNarration(mode, evidence, locale)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch {
        // graceful silence — never an error toast in this product
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
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
