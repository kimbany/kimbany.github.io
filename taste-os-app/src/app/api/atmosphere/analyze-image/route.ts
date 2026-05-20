import { NextResponse } from "next/server";
import { analyzeImageAtmosphere } from "@/lib/openai/vision";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Read the emotional atmosphere of an image (never its objects).
 * Returns only the emotional language, which becomes the embedding input
 * upstream — the raw pixels are not retained server-side.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "no session" }, { status: 401 });
  }

  const { imageUrl } = (await req.json()) as { imageUrl?: string };
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  try {
    const reading = await analyzeImageAtmosphere(imageUrl);
    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "could not read atmosphere" }, { status: 502 });
  }
}
