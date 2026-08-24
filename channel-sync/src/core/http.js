import { log } from './log.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 채널 API는 대체로 초당 호출 제한이 있어 채널별로 최소 호출 간격을 둔다. */
const lastCallAt = new Map();

export class HttpError extends Error {
  constructor(status, body, url) {
    super(`HTTP ${status} — ${url}\n${String(body).slice(0, 500)}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * 재시도 + 레이트리밋이 붙은 fetch.
 * 4xx 는 즉시 실패(키·파라미터 문제라 재시도해도 같음), 5xx·429·네트워크는 백오프 재시도.
 */
export async function request(url, {
  method = 'GET', headers = {}, body, as = 'json',
  channel = 'default', minIntervalMs = 200, retries = 3, timeoutMs = 30_000,
} = {}) {
  const gap = Date.now() - (lastCallAt.get(channel) ?? 0);
  if (gap < minIntervalMs) await sleep(minIntervalMs - gap);

  for (let attempt = 0; ; attempt++) {
    lastCallAt.set(channel, Date.now());
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body, signal: ac.signal });
      const text = await res.text();
      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        if (retryable && attempt < retries) {
          const wait = 2 ** attempt * 1000;
          log.warn(`${channel} ${res.status} — ${wait}ms 후 재시도 (${attempt + 1}/${retries})`);
          await sleep(wait);
          continue;
        }
        throw new HttpError(res.status, text, url);
      }
      if (as === 'text') return text;
      if (!text) return null;
      try { return JSON.parse(text); } catch { return text; }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if (attempt >= retries) throw err;
      const wait = 2 ** attempt * 1000;
      log.warn(`${channel} ${err.name === 'AbortError' ? '타임아웃' : err.message} — ${wait}ms 후 재시도`);
      await sleep(wait);
    } finally {
      clearTimeout(timer);
    }
  }
}

/** 커서/페이지 기반 목록을 끝까지 훑는다. 안전장치로 최대 페이지 수를 둔다. */
export async function paginate(fetchPage, { maxPages = 200 } = {}) {
  const all = [];
  let cursor;
  for (let page = 0; page < maxPages; page++) {
    const { items, next } = await fetchPage(cursor, page);
    all.push(...items);
    if (!next) return all;
    cursor = next;
  }
  log.warn(`페이지 상한(${maxPages})에 걸려 중단 — 누락 가능`);
  return all;
}
