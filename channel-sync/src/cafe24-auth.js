#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { request } from './core/http.js';
import { loadEnv, env, credentials } from './config.js';
import { ROOT } from './core/store.js';
import { log } from './core/log.js';

/**
 * 카페24 OAuth 재인증 — refresh_token 을 새로 받는다.
 *
 *   node src/cafe24-auth.js
 *
 * 1) 출력되는 주소를 브라우저에서 열고 쇼핑몰 관리자로 '동의'
 * 2) 이동된 주소창의 주소 전체를 복사해 터미널에 붙여넣기
 * 3) 받은 토큰을 data/.cafe24-token.json 과 .env 의 CAFE24_REFRESH_TOKEN 에 저장
 *
 * 권한(scope)을 바꾼 뒤에는 기존 토큰에 반영되지 않으므로 이걸 한 번 다시 돌려야 한다.
 * 인증 코드는 1분 안에 써야 하니 동의 후 바로 붙여넣는다.
 */

const KEYS = ['CAFE24_MALL_ID', 'CAFE24_CLIENT_ID', 'CAFE24_CLIENT_SECRET', 'CAFE24_REDIRECT_URI'];
const DEFAULT_SCOPE = 'mall.read_product,mall.read_order,mall.read_mileage';

async function saveRefreshToEnv(refreshToken) {
  const path = join(ROOT, '.env');
  let text;
  try { text = await readFile(path, 'utf8'); } catch { return false; }
  const line = `CAFE24_REFRESH_TOKEN=${refreshToken}`;
  text = /^CAFE24_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^CAFE24_REFRESH_TOKEN=.*$/m, line)
    : `${text.trimEnd()}\n${line}\n`;
  await writeFile(path, text, 'utf8');
  return true;
}

async function main() {
  await loadEnv();
  const { values, missing } = credentials(KEYS);
  if (missing.length) throw new Error(`.env 미설정: ${missing.join(', ')}`);

  const mallId = values.CAFE24_MALL_ID;
  const scope = env('CAFE24_SCOPE', DEFAULT_SCOPE);
  const state = Math.random().toString(36).slice(2, 10);
  const authorize = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: values.CAFE24_CLIENT_ID,
    state,
    redirect_uri: values.CAFE24_REDIRECT_URI,
    scope,
  })}`;

  console.log('\n1) 아래 주소를 브라우저에서 열고, 쇼핑몰 관리자 계정으로 로그인해 "동의" 를 누르세요.\n');
  console.log(`   ${authorize}\n`);
  console.log('2) 화면이 이동하면 (페이지가 안 떠도 괜찮습니다) 주소창의 주소 전체를 복사해 아래에 붙여넣으세요.');
  console.log('   ※ 1분 안에 붙여넣어야 합니다.\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pasted = (await rl.question('붙여넣기 > ')).trim();
  rl.close();

  let code = pasted;
  try {
    const u = new URL(pasted);
    if (u.searchParams.get('error')) throw new Error(`동의 실패: ${u.searchParams.get('error_description') || u.searchParams.get('error')}`);
    if (u.searchParams.get('state') && u.searchParams.get('state') !== state) throw new Error('state 가 다릅니다 — 방금 출력된 주소로 다시 시도하세요');
    code = u.searchParams.get('code') ?? '';
  } catch (e) {
    if (e.message.startsWith('동의') || e.message.startsWith('state')) throw e;
    // 주소가 아니면 code 값만 붙여넣은 것으로 본다
  }
  if (!code) throw new Error('주소에서 code 값을 찾지 못했습니다');

  const res = await request(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${values.CAFE24_CLIENT_ID}:${values.CAFE24_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: values.CAFE24_REDIRECT_URI }),
    channel: 'cafe24',
    retries: 0,
  });
  if (!res?.refresh_token) throw new Error(`토큰 발급 실패: ${JSON.stringify(res)}`);

  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(join(ROOT, 'data', '.cafe24-token.json'), JSON.stringify(res, null, 2), 'utf8');
  const inEnv = await saveRefreshToEnv(res.refresh_token);

  log.ok('새 토큰 발급 완료 — data/.cafe24-token.json 저장');
  log.ok(inEnv ? '.env 의 CAFE24_REFRESH_TOKEN 도 바꿨습니다' : '.env 파일이 없어 토큰 파일에만 저장했습니다');
  log.info(`권한: ${(res.scopes ?? []).join(', ') || scope}`);
  if (!(res.scopes ?? [scope]).join(',').includes('mall.read_mileage')) {
    log.warn('적립금 읽기 권한이 빠져 있습니다 — 개발자센터 앱 권한 설정을 확인하세요');
  }
}

main().catch((err) => {
  log.fail(err.message.split('\n').slice(0, 2).join('\n'));
  if (String(err.message).includes('invalid_grant')) log.warn('인증 코드가 만료됐거나 이미 쓰였습니다 — 처음부터 다시 실행하세요');
  if (String(err.message).includes('redirect_uri')) log.warn('CAFE24_REDIRECT_URI 가 개발자센터 앱에 등록한 Redirect URI 와 글자 하나까지 같아야 합니다');
  process.exitCode = 1;
});
