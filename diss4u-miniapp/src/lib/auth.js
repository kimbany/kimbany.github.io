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

/**
 * 토스 앱에서 이 미니앱의 로그인 연결을 끊었는지 확인한다.
 *
 * 체크리스트가 두 가지를 요구한다.
 *   "토스 앱에서 로그인 연결을 끊은 뒤 미니앱에 다시 접속하면,
 *    다시 로그인을 요청하는 약관 화면이 노출돼요."
 *   "토스 앱에서 로그인 연결을 끊으면 사용자 데이터가 미니앱에 남아 있지 않아요."
 *
 * Firebase 세션은 토스 연결과 별개로 살아 있어서, 연결을 끊어도 미니앱은
 * 여전히 로그인 상태로 보인다. 그래서 부팅할 때 한 번 대조해야 한다.
 *
 * @returns {Promise<boolean|null>} 연결됨/끊김. 판단할 수 없으면 null.
 */
export async function isLinked() {
  try {
    if (typeof TossAuth?.isIntegrated?.isSupported === 'function' && !TossAuth.isIntegrated.isSupported()) {
      // 토스 앱 버전이 낮아 확인할 수 없다. 섣불리 로그아웃시키지 않는다.
      return null;
    }
    const linked = await TossAuth.isIntegrated();
    // 구버전은 undefined 를 돌려준다 — 이때도 판단하지 않는다.
    return typeof linked === 'boolean' ? linked : null;
  } catch {
    // 토스 로그인을 안 쓰는 미니앱에서 부르면 설정 오류로 던진다. 브라우저도 마찬가지.
    return null;
  }
}
