/* 공용 유틸 — DOM/게임 로직 양쪽에서 쓰는 순수 함수 모음 */

let seq = 0;
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function randInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher-Yates. 원본을 건드리지 않고 새 배열을 돌려준다. */
export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function groupBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export const ORDINAL_KO = ['', '1위', '2위', '3위', '4위', '5위', '6위', '7위', '8위', '9위', '10위'];
export function ordinal(rank) {
  return ORDINAL_KO[rank] || `${rank}위`;
}
