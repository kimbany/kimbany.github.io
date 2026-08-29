/* 가챠 화면 아이콘 — 이모지 대신 인라인 SVG 를 쓴다.
 * 모두 currentColor 를 따르고, 크기는 CSS 에서 정한다. */

const wrap = (inner, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;

/** 캡슐 (가챠 상징) — 아래 반쪽을 채워 "뽑기 캡슐"로 읽히게 한다 */
export const 아이콘_캡슐 = wrap(`
  <path d="M3.5 12a8.5 8.5 0 0 0 17 0z" fill="currentColor" stroke="none" opacity="0.92" />
  <circle cx="12" cy="12" r="8.5" />
  <path d="M3.5 12h17" />`);

/** 더하기 / 빼기 */
export const 아이콘_더하기 = wrap(`<path d="M12 5v14M5 12h14" />`);
export const 아이콘_빼기 = wrap(`<path d="M5 12h14" />`);

/** 손잡이 돌리기 */
export const 아이콘_돌리기 = wrap(`
  <path d="M12 4.5v15" stroke-width="2.4" />
  <circle cx="12" cy="12" r="8.5" opacity="0.45" stroke-width="1.6" />`);

/** 아래 화살표 (펼치기) */
export const 아이콘_아래 = wrap(`<path d="M6 9.5l6 6 6-6" />`);
export const 아이콘_위 = wrap(`<path d="M6 14.5l6-6 6 6" />`);

/** 별 (마지막 캡슐 강조) */
export const 아이콘_별 = wrap(`
  <path d="M12 3.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.6 6.8 19.5 8 13.7 3.6 9.7l5.9-.7z" fill="currentColor" stroke-width="1.6" />`);

/** 되돌리기 */
export const 아이콘_되돌리기 = wrap(`
  <path d="M4 9h9a5.5 5.5 0 1 1 0 11H7" />
  <path d="M8 4.5L3.6 9 8 13.5" />`);
