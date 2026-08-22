/*
 * 토스 로그인 → Firebase Custom Token.
 *
 * proxy/server.js 에 드롭인하는 모듈. 기존 /auth/kakao 와 같은 모양이라
 * 그 코드를 읽어봤다면 바로 이해된다.
 *
 * 흐름
 *   클라: TossAuth.login() → { authorizationCode, referrer }
 *   서버: authorizationCode → AccessToken → 사용자정보(암호문) → 복호화
 *         → 이메일로 기존 Firebase 사용자 매칭 → Custom Token 발급
 *   클라: signInWithCustomToken()
 *
 * 이메일이 유일한 연결 고리다. 콘솔에서 CI 를 '사용 안함'으로 잡았고 userKey 는
 * 앱 단위 값이라 웹 회원과 이어붙일 수 없기 때문이다.
 *
 * 필요한 환경변수
 *   TOSS_CLIENT_ID          콘솔에서 발급
 *   TOSS_CLIENT_SECRET      콘솔에서 발급
 *   TOSS_LOGIN_DECRYPT_KEY  base64. 신청 후 이메일로 받는다.
 *   TOSS_LOGIN_DECRYPT_AAD  (선택) 복호화 AAD. 기본값 'TOSS' — 아래 주석 참고.
 */

import crypto from 'node:crypto';

const API_BASE = 'https://apps-in-toss-api.toss.im';
const TOKEN_URL = `${API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`;
const ME_URL = `${API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/login-me`;

const GCM_TAG_BYTES = 16;
const GCM_IV_BYTES = 12;

/*
 * AAD 는 고정 문자열 'TOSS' 다.
 *
 * 공개 문서에는 값이 안 나와 있고, 복호화 키를 발급받을 때 오는 메일에 키와 나란히
 * 적혀 온다. 비밀이 아니라 상수라서 기본값으로 박아둔다. 토스가 나중에 값을 바꾸면
 * TOSS_LOGIN_DECRYPT_AAD 환경변수로 덮어쓸 수 있다.
 */
const DEFAULT_AAD = 'TOSS';

/**
 * 토스가 내려주는 개인정보 복호화.
 *
 * 형식: base64( IV(12B) || ciphertext || tag(16B) ), AES-256-GCM.
 */
export function decryptField(base64Value, keyBase64, aad) {
  if (!base64Value) return null;

  const raw = Buffer.from(String(base64Value), 'base64');
  if (raw.length <= GCM_IV_BYTES + GCM_TAG_BYTES) {
    throw new Error('암호문이 너무 짧아요');
  }

  const iv = raw.subarray(0, GCM_IV_BYTES);
  const tag = raw.subarray(raw.length - GCM_TAG_BYTES);
  const body = raw.subarray(GCM_IV_BYTES, raw.length - GCM_TAG_BYTES);
  const key = Buffer.from(String(keyBase64), 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));

  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}

async function exchangeToken(authorizationCode, referrer) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 콘솔 발급값. 헤더 이름은 파트너 문서 기준이며, 연동 시 한 번 대조할 것.
      'X-Toss-Client-Id': process.env.TOSS_CLIENT_ID || '',
      'X-Toss-Client-Secret': process.env.TOSS_CLIENT_SECRET || '',
    },
    body: JSON.stringify({ authorizationCode, referrer }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`토큰 발급 실패 (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text);
  const payload = json.success || json.result || json;
  const accessToken = payload?.accessToken;
  if (!accessToken) throw new Error('응답에 accessToken 이 없어요');
  return accessToken;
}

async function fetchLoginMe(accessToken) {
  const res = await fetch(ME_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`사용자 정보 조회 실패 (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text);
  return json.success || json.result || json;
}

/**
 * server.js 에 붙일 핸들러를 만든다.
 *
 * @param {object} deps server.js 안의 기존 헬퍼들
 * @param {(res:any, status:number, body:object)=>void} deps.send
 * @param {(req:any)=>Promise<object>} deps.readBody
 * @param {import('firebase-admin')} deps.admin
 * @param {(uid:string, email:string)=>Promise<any>} deps.getOrCreateUser
 * @param {()=>boolean} deps.creditsEnabled
 */
export function createTossLoginHandler({ send, readBody, admin, getOrCreateUser, creditsEnabled }) {
  return async function handleTossLogin(req, res) {
    if (!creditsEnabled()) {
      return send(res, 400, { error: 'auth_disabled', message: '인증 시스템이 비활성 상태예요' });
    }

    const decryptKey = process.env.TOSS_LOGIN_DECRYPT_KEY;
    if (!decryptKey) {
      return send(res, 500, {
        error: 'toss_not_configured',
        message: '서버에 토스 로그인 설정이 없어요',
      });
    }

    const body = await readBody(req);
    const authorizationCode = body?.authorizationCode;
    if (!authorizationCode) {
      return send(res, 400, { error: 'no_code', message: '인가코드가 없어요' });
    }

    let profile;
    try {
      const accessToken = await exchangeToken(authorizationCode, body.referrer || '');
      profile = await fetchLoginMe(accessToken);
    } catch (e) {
      return send(res, 502, { error: 'toss_unreachable', message: e.message });
    }

    const userKey = profile?.userKey;
    if (userKey == null) {
      return send(res, 401, { error: 'no_user_key', message: '토스 사용자 식별에 실패했어요' });
    }

    const aad = process.env.TOSS_LOGIN_DECRYPT_AAD || DEFAULT_AAD;
    let email = null;
    let name = null;
    try {
      email = decryptField(profile.email, decryptKey, aad);
      name = decryptField(profile.name, decryptKey, aad);
    } catch (e) {
      return send(res, 500, { error: 'decrypt_failed', message: `개인정보 복호화 실패: ${e.message}` });
    }

    if (!email) {
      return send(res, 400, {
        error: 'no_email',
        message: '이메일 제공에 동의해야 로그인할 수 있어요',
      });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    /*
     * uid 결정.
     *
     * 같은 이메일로 이미 가입한 웹 회원이 있으면 그 uid 를 그대로 쓴다. 그래야
     * 기존 곡·크레딧이 그대로 따라온다. 없으면 토스 전용 uid 를 새로 만든다.
     */
    let uid;
    try {
      const existing = await admin.auth().getUserByEmail(normalizedEmail);
      uid = existing.uid;
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        return send(res, 500, { error: 'lookup_failed', message: e.message });
      }
      uid = `toss_${userKey}`;
      try {
        await admin.auth().createUser({
          uid,
          email: normalizedEmail,
          displayName: name || undefined,
          emailVerified: true,
        });
      } catch (createErr) {
        // 동시 요청으로 이미 만들어졌을 수 있다. custom token 발급은 계속 진행한다.
        if (createErr.code !== 'auth/uid-already-exists') {
          return send(res, 500, { error: 'create_failed', message: createErr.message });
        }
      }
    }

    try {
      const token = await admin.auth().createCustomToken(uid, { provider: 'toss' });
      try {
        await getOrCreateUser(uid, normalizedEmail);
      } catch {
        // 사용자 문서 생성 실패가 로그인을 막지는 않는다. /me 에서 다시 만든다.
      }
      return send(res, 200, { ok: true, token, uid, email: normalizedEmail, name });
    } catch (e) {
      return send(res, 500, { error: 'token_fail', message: `토큰 발급 실패: ${e.message}` });
    }
  };
}
