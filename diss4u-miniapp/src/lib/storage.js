/*
 * 저장소 래퍼.
 *
 * 원본은 localStorage 를 32곳에서 직접 썼다. 토스 웹뷰에서 localStorage 가
 * 지워지는 조건(웹뷰 데이터 정리 등)이 브라우저와 다를 수 있어, 앱인토스가 주는
 * Storage API 를 우선 쓰고 localStorage 로 떨어지게 했다.
 *
 * Storage API 는 비동기라 전부 Promise 다. 동기 호출이 필요한 자리가 없도록
 * 호출부를 async 로 맞췄다.
 */

import { Storage } from '@apps-in-toss/web-framework';

let backend = null;

function pickBackend() {
  if (backend) return backend;
  const usable =
    Storage &&
    typeof Storage.getItem === 'function' &&
    typeof Storage.setItem === 'function';
  backend = usable ? 'toss' : 'local';
  return backend;
}

export async function get(key) {
  if (pickBackend() === 'toss') {
    try {
      return await Storage.getItem(key);
    } catch {
      // 브라우저 미리보기 등 브리지가 없는 환경. localStorage 로 내려간다.
      backend = 'local';
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function set(key, value) {
  if (pickBackend() === 'toss') {
    try {
      await Storage.setItem(key, String(value));
      return;
    } catch {
      backend = 'local';
    }
  }
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* 저장 실패는 기능을 막지 않는다 — 캐시 용도로만 쓰기 때문. */
  }
}

export async function remove(key) {
  if (pickBackend() === 'toss') {
    try {
      await Storage.removeItem(key);
      return;
    } catch {
      backend = 'local';
    }
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* 위와 같음 */
  }
}

export async function getJSON(key, fallback = null) {
  const raw = await get(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function setJSON(key, value) {
  await set(key, JSON.stringify(value));
}

/** 어느 백엔드를 쓰고 있는지. 진단 화면용. */
export function backendName() {
  return pickBackend();
}
