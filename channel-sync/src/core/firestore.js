import { request } from './http.js';

/**
 * Firestore REST 최소 클라이언트 — 의존성 없이 쓰기만 한다.
 *
 * firebase-admin 대신 sales-report 와 같은 '이메일/비밀번호' 계정으로 로그인해 idToken 을 받는다.
 * 그래서 Firestore 보안 규칙이 그대로 적용되고, 서비스 계정 키를 따로 관리할 필요가 없다.
 * 테스트용으로 FIRESTORE_BASE_URL / FIREBASE_AUTH_BASE_URL 을 덮어쓸 수 있다.
 */

const AUTH_BASE = () => process.env.FIREBASE_AUTH_BASE_URL || 'https://identitytoolkit.googleapis.com';
const FS_BASE = () => process.env.FIRESTORE_BASE_URL || 'https://firestore.googleapis.com';
const BATCH = 500; // commit 한 번에 쓸 수 있는 최대 문서 수

/** JS 값 → Firestore Value. undefined 필드는 빼고, 정수/실수를 구분한다. */
export function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  return { mapValue: { fields: encodeFields(v) } };
}

/** Firestore Value → JS 값 */
export function decode(v) {
  if (!v || 'nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, decode(x)]));
  return null;
}

const encodeFields = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, x]) => x !== undefined).map(([k, x]) => [k, encode(x)]),
);

export async function connectFirestore({ apiKey, projectId, email, password }) {
  const auth = await request(`${AUTH_BASE()}/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    channel: 'firebase',
    retries: 1,
  });
  if (!auth?.idToken) throw new Error(`Firebase 로그인 실패: ${JSON.stringify(auth)}`);

  const root = `projects/${projectId}/databases/(default)/documents`;

  /** docs: [{ collection, id, data }] — 문서 전체를 덮어쓴다(upsert). 500개씩 나눠 commit. */
  async function upsert(docs) {
    for (let i = 0; i < docs.length; i += BATCH) {
      const writes = docs.slice(i, i + BATCH).map((d) => ({
        update: { name: `${root}/${d.collection}/${d.id}`, fields: encodeFields(d.data) },
      }));
      await request(`${FS_BASE()}/v1/${root}:commit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes }),
        channel: 'firebase',
      });
    }
    return docs.length;
  }

  /** 문서 하나 읽기. 없으면 null. */
  async function get(collection, id) {
    try {
      const doc = await request(`${FS_BASE()}/v1/${root}/${collection}/${id}`, {
        headers: { Authorization: `Bearer ${auth.idToken}` },
        channel: 'firebase',
      });
      return decode({ mapValue: { fields: doc?.fields ?? {} } });
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /** 컬렉션 전체 읽기 (관리 대상 목록처럼 작은 컬렉션용) */
  async function list(collection) {
    const out = [];
    let pageToken = '';
    do {
      const res = await request(`${FS_BASE()}/v1/${root}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, {
        headers: { Authorization: `Bearer ${auth.idToken}` },
        channel: 'firebase',
      });
      for (const d of res?.documents ?? []) out.push({ id: d.name.split('/').pop(), ...decode({ mapValue: { fields: d.fields ?? {} } }) });
      pageToken = res?.nextPageToken ?? '';
    } while (pageToken);
    return out;
  }

  return { upsert, get, list };
}

let shared = null;
/**
 * .env 의 Firebase 비밀번호로 한 번만 로그인해 같이 쓴다. 비밀번호가 없으면 null.
 * (config.js 를 늦게 불러오는 건 config → store → normalize 순환을 피하려고)
 */
export async function sharedFirestore() {
  if (shared) return shared;
  const { firebaseCredentials } = await import('../config.js');
  const { values, ready } = await firebaseCredentials();
  if (!ready) return null;
  shared = connectFirestore(values);
  return shared;
}
