/*
 * 로그인.
 *
 * 웹은 Firebase 구글 로그인(signInWithPopup)을 썼다. 토스 웹뷰에서는 구글 팝업이
 * 막히므로 미니앱에서는 토스 로그인을 쓴다. 흐름은 이렇다.
 *
 *   TossAuth.login()  → { authorizationCode, referrer }
 *     → 서버 POST /toss/login
 *         → 토스 서버에서 AccessToken 교환 → 사용자정보 조회(AES-256-GCM 암호문)
 *         → 이메일 복호화 → 기존 Firebase 사용자와 이메일로 매칭
 *         → firebase-admin 으로 Custom Token 발급
 *     → signInWithCustomToken()
 *
 * 이렇게 하면 Firestore 스키마도 보안 규칙도 손댈 게 없다. 콘솔에서 동의항목을
 * 이름 + 이메일로만 받아뒀고 CI 는 '사용 안함'이라, 기존 회원과 이어붙일 고리는
 * 이메일뿐이다.
 *
 * appLogin() 은 SDK 3.0.2 에서 deprecated 라 TossAuth.login() 을 쓴다.
 */

import { TossAuth } from '@apps-in-toss/web-framework';
import { signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { PROXY_URL } from '../config.js';

let currentUser = null;

export function getUser() {
  return currentUser;
}

export function onUserChanged(handler) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    handler(user);
  });
}

/** 현재 사용자의 Firebase ID 토큰. 로그아웃 상태면 null. */
export async function idToken() {
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

export class LoginError extends Error {
  constructor(message, code, options) {
    super(message, options);
    this.name = 'LoginError';
    this.code = code;
  }
}

export async function login() {
  let grant;
  try {
    grant = await TossAuth.login();
  } catch (e) {
    throw new LoginError('토스 로그인을 완료하지 못했어요.', 'toss_login_failed', { cause: e });
  }

  const authorizationCode = grant && (grant.authorizationCode || grant.code);
  if (!authorizationCode) {
    throw new LoginError('토스에서 인가코드를 받지 못했어요.', 'no_authorization_code');
  }

  let res;
  try {
    res = await fetch(`${PROXY_URL}/toss/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorizationCode,
        referrer: grant.referrer || null,
      }),
    });
  } catch {
    throw new LoginError('서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.', 'network');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new LoginError(data.message || '로그인 처리에 실패했어요.', data.error || 'server');
  }

  const cred = await signInWithCustomToken(auth, data.token);
  currentUser = cred.user;
  return cred.user;
}

export async function logout() {
  await signOut(auth);
  currentUser = null;
}
