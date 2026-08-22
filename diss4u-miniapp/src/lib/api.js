/*
 * Render 프록시 호출.
 *
 * 백엔드는 웹과 완전히 같은 것을 쓴다(가사 Claude→Solar→Gemini 폴백, 노래 kie/Apiframe).
 * 원본 callWorker() 의 상태코드 처리 규칙을 그대로 옮겼다.
 *   401 → 로그인 필요 · 402 → 크레딧 부족(충전 유도) · 429 → 사용량 한도
 */

import { PROXY_URL } from '../config.js';
import { idToken } from './auth.js';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload || {};
  }
  get needsLogin() {
    return this.status === 401;
  }
  get needsCredits() {
    return this.status === 402;
  }
  get rateLimited() {
    return this.status === 429;
  }
}

async function headers(extra) {
  const h = { 'Content-Type': 'application/json', ...(extra || {}) };
  const token = await idToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function parse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(PROXY_URL + path, options);
  } catch (e) {
    throw new ApiError('서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.', 0, { cause: e });
  }

  if (res.ok) return parse(res);

  const payload = await parse(res);
  const message =
    payload.message ||
    payload.error ||
    (res.status === 401
      ? '로그인이 필요해요.'
      : res.status === 402
        ? '크레딧이 부족해요.'
        : res.status === 429
          ? '사용량 한도를 넘었어요. 잠시 후 다시 시도해주세요.'
          : `서버 오류 (${res.status})`);
  throw new ApiError(message, res.status, payload);
}

export async function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(body || {}),
  });
}

export async function get(path) {
  return request(path, { method: 'GET', headers: await headers() });
}

/* ===== 개별 엔드포인트 ===== */

export function fetchMe() {
  return get('/me');
}

export function generateLyrics(input) {
  return post('/generate-lyrics', input);
}

export function generateSong(input) {
  return post('/generate-song', input);
}

export function songStatus(jobId) {
  return get(`/song-status/${encodeURIComponent(jobId)}`);
}

export function creditHistory() {
  return get('/credit-history');
}

/** 공유 리워드(곡당 1회, +2크레딧). 서버가 중복 지급을 막는다. */
export function claimShareReward(songId) {
  return post('/share-reward', { songId });
}

/** 인앱결제 주문 검증 + 크레딧 적립. 서버가 토스 주문조회 API(mTLS)로 확인한다. */
export function verifyIapOrder(orderId, sku) {
  return post('/toss/iap/verify', { orderId, sku });
}

/**
 * 추천인 코드 귀속. 신규 유저가 첫 곡을 만들면 추천인에게 +10p 가 간다.
 * 서버가 '이미 귀속됨/이미 곡 만듦/본인 코드' 를 전부 걸러 { ok:false, reason } 으로 답한다.
 */
export function claimReferral(ref) {
  return post('/claim-referral', { ref });
}

/** 쿠폰 등록. 무료 풀에 적립된다. */
export function redeemCoupon(code) {
  return post('/redeem-coupon', { code });
}

/** 회원 탈퇴. 남은 크레딧은 소멸한다. */
export function deleteAccount() {
  return post('/delete-account', {});
}

/** 곡 신고. */
export function reportSong(songId, reason) {
  return post('/report-song', { songId, reason });
}
