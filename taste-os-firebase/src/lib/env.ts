/**
 * Environment configuration — fail loudly on misconfig in production, stay
 * quiet in dev. Public (client-safe) vars vs. server-only secrets are kept
 * strictly separate.
 */

const PUBLIC_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const SERVER_KEYS = ["OPENAI_API_KEY", "FIREBASE_SERVICE_ACCOUNT"] as const;

/** Require a server-only secret at call time (throws if missing in prod). */
export function requireServerEnv(name: (typeof SERVER_KEYS)[number]): string {
  const v = process.env[name];
  if (!v) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required server env: ${name}`);
    }
    return "";
  }
  return v;
}

/** Verify public config is present (call once at startup / in a health route). */
export function checkPublicEnv(): { ok: boolean; missing: string[] } {
  const missing = PUBLIC_KEYS.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
