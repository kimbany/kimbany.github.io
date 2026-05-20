import "server-only";
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin (server-only). Bypasses Security Rules, so every query must
 * scope explicitly by uid. Used by server actions, the narrate route, and the
 * memory-engine background jobs.
 */
function adminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    return initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  // fall back to Application Default Credentials (e.g. on GCP / emulator)
  return initializeApp({ credential: applicationDefault() });
}

const appInstance = adminApp();
export const adminAuth = getAuth(appInstance);
export const adminDb = getFirestore(appInstance);

/** Verify a session/ID token from the client → uid (or null). */
export async function verifyUid(idToken?: string | null): Promise<string | null> {
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}
