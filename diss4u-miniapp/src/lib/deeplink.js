/*
 * 미니앱 진입 딥링크 파싱.
 *
 * 웹은 diss4u.com/?ref=CODE 로 초대 링크를 돌렸다. 미니앱은 밖으로 못 내보내니
 * Share.createLink 로 intoss://diss4u?ref=CODE 형태의 링크를 만들고,
 * 그 링크로 들어온 진입 URL 을 여기서 읽는다.
 *
 * Environment.initialURL 은 "처음 진입할 때" 값이라 이후 화면 이동으로는 안 바뀐다.
 * 그래서 부팅 때 한 번만 읽으면 된다.
 */

import { Environment } from '@apps-in-toss/web-framework';

let cached = null;

function entryUrl() {
  try {
    const url = Environment?.initialURL;
    if (url) return url;
  } catch {
    // 브리지 없음(브라우저 개발). 아래 location 으로 떨어진다.
  }
  return typeof location !== 'undefined' ? location.href : '';
}

/** 진입 URL 의 쿼리 파라미터. 파싱 실패하면 빈 객체. */
export function params() {
  if (cached) return cached;

  const url = entryUrl();
  const out = {};
  const q = url.indexOf('?');
  if (q >= 0) {
    // intoss://diss4u?ref=ABC 는 URL 로 파싱하면 스킴 때문에 걸릴 수 있어 직접 자른다.
    const search = url.slice(q + 1).split('#')[0];
    for (const pair of search.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = decodeURIComponent(eq < 0 ? pair : pair.slice(0, eq));
      const value = eq < 0 ? '' : decodeURIComponent(pair.slice(eq + 1));
      if (key) out[key] = value;
    }
  }

  cached = out;
  return out;
}

/** 초대 링크로 들어왔다면 추천인 코드. */
export function referralCode() {
  const ref = params().ref;
  return ref ? String(ref).trim().toUpperCase() : null;
}

/** 공유 링크로 들어왔다면 열어야 할 곡 ID. */
export function songId() {
  const url = entryUrl();
  const m = url.match(/\/song\/([^/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return params().song || null;
}
