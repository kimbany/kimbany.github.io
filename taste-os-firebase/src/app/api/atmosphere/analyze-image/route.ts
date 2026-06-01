import { NextResponse } from "next/server";
import { runVision } from "@/lib/ai/visionPipeline";
import { requireUid, bearerFrom, UnauthorizedError } from "@/lib/server/guard";
import { rateLimit, rateKey } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

/**
 * Protected vision endpoint. Reads the emotional atmosphere of an image
 * (never its objects) and returns the feeling — the pixels are not retained.
 * Requires a valid Firebase ID token (Authorization: Bearer <token>).
 */
export async function POST(req: Request) {
  let uid: string;
  try {
    uid = await requireUid(bearerFrom(req));
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw e;
  }

  // vision is the costliest call — keep it gentle (10 / minute / user)
  const limited = rateLimit(rateKey(req, uid), 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { imageUrl } = (await req.json()) as { imageUrl?: string };
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  try {
    const { reading } = await runVision(imageUrl);
    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "could not read atmosphere" }, { status: 502 });
  }
}
