import "server-only";
import { verifyUid } from "@/lib/firebase/admin";

/**
 * Route / server-action protection. The client passes its Firebase ID token;
 * we verify it server-side and return the uid. Throws if unauthenticated.
 * (Firebase auth is token-based, so privileged work is always token-gated.)
 */
export async function requireUid(idToken?: string | null): Promise<string> {
  const uid = await verifyUid(idToken);
  if (!uid) throw new UnauthorizedError();
  return uid;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Read the bearer token from an Authorization header (for API routes). */
export function bearerFrom(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1]! : null;
}
