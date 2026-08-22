/*
 * 실행 환경 판별.
 *
 * 같은 번들을 브라우저(vite dev)에서도 열어보며 개발하기 때문에,
 * 토스 브리지가 없는 환경에서 SDK 를 부르면 던진다는 걸 전제로 감싼다.
 */

import {
  getOperationalEnvironment,
  getPlatformOS,
  getSafeAreaInsets,
} from '@apps-in-toss/web-framework';

let cached = null;

export function describe() {
  if (cached) return cached;

  let platform = 'web';
  let operational = 'unknown';
  let inToss = false;

  try {
    platform = getPlatformOS() || 'web';
  } catch {
    platform = 'web';
  }

  try {
    operational = getOperationalEnvironment() || 'unknown';
    inToss = true;
  } catch {
    // 브리지가 없다 = 토스 앱 밖(개발용 브라우저).
    inToss = false;
  }

  cached = { platform, operational, inToss };
  return cached;
}

export function isInToss() {
  return describe().inToss;
}

/**
 * safe area 를 CSS 변수로 심는다.
 * env(safe-area-inset-*) 는 웹뷰에 따라 0 으로 나오는 경우가 있어
 * SDK 값이 있으면 그걸로 덮어쓴다.
 */
export async function applySafeArea() {
  let insets = null;
  try {
    insets = await getSafeAreaInsets();
  } catch {
    return;
  }
  if (!insets) return;
  const root = document.documentElement;
  if (typeof insets.top === 'number') root.style.setProperty('--safe-top', `${insets.top}px`);
  if (typeof insets.bottom === 'number') {
    root.style.setProperty('--safe-bottom', `${insets.bottom}px`);
  }
}
