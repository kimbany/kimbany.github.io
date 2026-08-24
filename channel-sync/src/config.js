import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './core/store.js';

/** .env 를 읽어 process.env 에 얹는다 (이미 있는 값은 덮지 않음 — CI/셸 주입이 우선). */
export async function loadEnv() {
  let text = '';
  try { text = await readFile(join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

export const env = (key, fallback = '') => (process.env[key] ?? fallback).trim();

/** 필요한 키가 하나라도 비면 그 채널은 '미설정'으로 건너뛴다. */
export function credentials(keys) {
  const values = Object.fromEntries(keys.map((k) => [k, env(k)]));
  const missing = keys.filter((k) => !values[k]);
  return { values, missing, ready: missing.length === 0 };
}
