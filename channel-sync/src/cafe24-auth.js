#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { request } from './core/http.js';
import { loadEnv, env, credentials, setEnv } from './config.js';
import { saveToken } from './adapters/cafe24.js';
import { log } from './core/log.js';

/**
 * 카페24 OAuth 재인증 — refresh_token 을 새로 받는다.
 *
 *   node src/cafe24-auth.js
 *
 * 0) .env 에 카페24 값이 없으면 하나씩 물어보고 .env 를 만든다
 * 1) 브라우저에 동의 화면을 열어 준다 — 쇼핑몰 관리자로 '동의'
 * 2) 이동된 주소창의 주소 전체를 복사해 터미널에 붙여넣기
 * 3) 받은 토큰을 data/.cafe24-token.json 과 .env 의 CAFE24_REFRESH_TOKEN 에 저장
 *
 * 권한(scope)을 바꾼 뒤에는 기존 토큰에 반영되지 않으므로 이걸 한 번 다시 돌려야 한다.
 * 인증 코드는 1분 안에 써야 하니 동의 후 바로 붙여넣는다.
 */

const KEYS = ['CAFE24_MALL_ID', 'CAFE24_CLIENT_ID', 'CAFE24_CLIENT_SECRET', 'CAFE24_REDIRECT_URI'];
const DEFAULT_SCOPE = 'mall.read_product,mall.read_order,mall.read_mileage';

/** 처음 실행이면 .env 를 직접 만들 필요 없이 여기서 물어보고 채운다. */
const QUESTIONS = {
  CAFE24_MALL_ID: { label: '쇼핑몰 아이디', hint: '예: daseong24' },
  CAFE24_CLIENT_ID: { label: 'Client ID', hint: '개발자센터 > 앱 > 인증정보 > Client ID [복사]' },
  CAFE24_CLIENT_SECRET: { label: 'Client Secret Key', hint: '개발자센터 > 앱 > 인증정보 > Client Secret Key [보기]' },
  CAFE24_REDIRECT_URI: { label: 'Redirect URI', hint: '앱에 등록한 값과 똑같이', fallback: 'https://invedory.com/' },
};

/** 브라우저를 자동으로 연다. 안 되면 주소를 복사해 열면 된다. */
function openBrowser(url) {
  // 윈도우: explorer.exe 는 긴 주소(? & 포함)를 못 받고 폴더 창을 열어 버린다 → URL 핸들러로 직접 연다.
  const [cmd, args] = process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* 수동으로 열면 됨 */ }
}

async function main() {
  await loadEnv();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const { missing } = credentials(KEYS);
  if (missing.length) {
    console.log('\n처음 설정입니다. 아래 값을 하나씩 붙여넣고 엔터를 누르세요. (입력한 값은 channel-sync/.env 에 저장됩니다)\n');
    for (const key of missing) {
      const q = QUESTIONS[key];
      const def = q.fallback ? ` [그냥 엔터 = ${q.fallback}]` : '';
      let answer = '';
      while (!answer) {
        answer = (await rl.question(`${q.label} (${q.hint})${def}\n> `)).trim() || q.fallback || '';
      }
      await setEnv(key, answer);
    }
    log.ok('.env 저장 완료\n');
  }
  const { values } = credentials(KEYS);

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

  console.log('\n1) 브라우저에 카페24 동의 화면이 열립니다. 쇼핑몰 관리자로 로그인해 "동의" 를 누르세요.');
  console.log('   (브라우저가 안 열리면 아래 주소를 복사해 주소창에 붙여넣으세요)\n');
  console.log(`   ${authorize}\n`);

  await rl.question('준비되면 엔터를 누르세요 (브라우저가 열립니다) ');
  openBrowser(authorize);
  console.log('\n2) 동의 후 화면이 이동하면 (페이지 모양은 상관없습니다) 주소창의 주소 전체를 복사해 아래에 붙여넣으세요.');
  console.log('   ※ 동의 후 1분 안에 붙여넣어야 합니다.\n');
  // 붙여넣은 글에 동의 주소까지 섞여 들어오거나 여러 줄이 한꺼번에 들어와도 되게,
  // code 를 찾을 때까지 계속 받는다 (남은 줄이 프로그램 밖 명령 창으로 새지 않게).
  let code = '';
  while (!code) {
    const pasted = (await rl.question('붙여넣기 > ')).trim();
    if (!pasted) continue;
    const error = /[?&]error_description=([^&\s]+)/.exec(pasted) ?? /[?&]error=([^&\s]+)/.exec(pasted);
    if (error) { rl.close(); throw new Error(`동의 실패: ${decodeURIComponent(error[1])}`); }
    const codes = [...pasted.matchAll(/[?&]code=([^&\s]+)/g)];
    if (codes.length) {
      const last = codes.at(-1);
      const got = /[?&]state=([^&\s]+)/.exec(pasted.slice(last.index))?.[1];
      if (got && got !== state) {
        console.log('   이 주소는 예전 동의에서 나온 것입니다. 방금 열린 동의 화면에서 다시 동의하고 붙여넣으세요.');
        continue;
      }
      code = decodeURIComponent(last[1]);
    } else if (/^[A-Za-z0-9_-]{10,}$/.test(pasted)) {
      code = pasted; // code 값만 붙여넣은 경우
    } else {
      console.log('   주소에서 code= 를 찾지 못했습니다. 동의 후 브라우저 주소창의 주소(https://invedory.com/?code=...)를 붙여넣으세요.');
    }
  }
  rl.close();

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

  const where = await saveToken(res);
  await setEnv('CAFE24_REFRESH_TOKEN', res.refresh_token);

  log.ok(`새 토큰 발급 완료 — ${where === 'file+db' ? 'PC 파일 + Firestore(자동 실행용)' : 'data/.cafe24-token.json'} 저장`);
  log.ok('.env 의 CAFE24_REFRESH_TOKEN 도 바꿨습니다 — 이제 node src/points.js 로 적립금을 받아올 수 있습니다');
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
