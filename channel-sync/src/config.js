import { readFile, writeFile } from 'node:fs/promises';
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

/** .env 의 한 줄을 바꾼다(없으면 추가). .env 가 없으면 .env.example 을 복사해 만든다. */
export async function setEnv(key, value) {
  const path = join(ROOT, '.env');
  let text;
  try { text = await readFile(path, 'utf8'); } catch {
    try { text = await readFile(join(ROOT, '.env.example'), 'utf8'); } catch { text = ''; }
  }
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  await writeFile(path, text, 'utf8');
  process.env[key] = value;
}

/**
 * Firebase 접속값. 비밀번호만 꼭 필요하고 나머지는 sales-report 와 같은 값으로 채운다.
 * 웹 API 키는 공개용이라 sales-report/index.html 의 firebaseConfig 에서 그대로 읽어 온다.
 */
export async function firebaseCredentials() {
  let apiKey = env('FIREBASE_API_KEY');
  if (!apiKey) {
    try {
      const html = await readFile(join(ROOT, '..', 'sales-report', 'index.html'), 'utf8');
      apiKey = /apiKey:\s*["']([^"']+)["']/.exec(html)?.[1] ?? '';
    } catch { /* 저장소 밖에서 돌리는 경우 */ }
  }
  const values = {
    apiKey,
    projectId: env('FIREBASE_PROJECT_ID') || 'monfruit-sales',
    email: env('FIREBASE_EMAIL') || 'owner@monfruit-sales.web',
    password: env('FIREBASE_PASSWORD'),
  };
  const missing = [!values.apiKey && 'FIREBASE_API_KEY', !values.password && 'FIREBASE_PASSWORD'].filter(Boolean);
  return { values, missing, ready: missing.length === 0 };
}
