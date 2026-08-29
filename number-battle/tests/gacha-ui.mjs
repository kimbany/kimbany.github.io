/* 가챠 화면 동작 회귀 테스트 — Playwright(Chromium) 필요
 *   node tests/gacha-ui.mjs      (사전에 저장소 루트에서 정적 서버 실행)
 *
 * 로직은 tests/gacha.test.mjs 가 검증한다. 여기서는 화면에서만 드러나는 것들을 본다.
 *  - 뽑고 나면 다음 사람 차례에 이름 입력란이 비어 있는가
 *  - 결과를 본 뒤 화면을 벗어나면 자동 초기화되는가 (진행 중일 때는 유지되는가)
 */
import { chromium } from 'playwright';

const URL = process.env.NB_URL || 'http://127.0.0.1:8899/number-battle/index.html';

let pass = 0;
const 실패 = [];
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error' && !/ERR_CONNECTION_RESET|fonts\.|jsdelivr/.test(m.text())) errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const click = (s) => page.locator(s).first().click({ timeout: 8000 });
const screenText = () => page.evaluate(() => document.getElementById('screen').innerText);
function ok(msg) { pass += 1; console.log(`  ✅ ${msg}`); }
function fail(msg) { 실패.push(msg); console.log(`  ❌ ${msg}`); }
function assert(cond, msg) { if (cond) ok(msg); else fail(msg); }

/** 한 번 뽑고 결과 공개까지 */
async function 뽑기(name) {
  await page.waitForSelector('.gacha-go:not([disabled])');
  if (name !== undefined) await page.fill('[data-input="name"]', name);
  await click('.gacha-go');
  await page.waitForSelector('.co-number', { timeout: 15000 });
}
async function 종료() {
  await click('#host-btn');
  await page.waitForSelector('.drawer');
  await click('.drawer [data-act="end"]');
  await page.waitForSelector('.modal');
  await click('.modal [data-act="ok"]');
  await page.waitForSelector('[data-act="again"]', { timeout: 12000 });
}

await page.goto(`${URL}#gacha`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-act="start"]');
await click('[data-act="names"]');
for (let i = 11; i > 5; i -= 1) await click('[data-step="-1"]'); // 5개로
await click('[data-act="start"]');

console.log('\n▍이름 입력란');
let 남은이름 = null;
for (const name of ['현우', '영희', '철수']) {
  const before = await page.inputValue('[data-input="name"]');
  if (before !== '') 남은이름 = `${name} 차례에 "${before}" 가 남아 있음`;
  await 뽑기(name);
  const who = (await page.locator('.g-result-who').innerText()).trim();
  if (who !== name) 남은이름 = 남은이름 || `결과 이름 불일치: ${who}`;
  await click('[data-act="next"]');
  await page.waitForTimeout(180);
}
assert(!남은이름, `다음 사람 차례마다 입력란이 비어 있다 (3회) ${남은이름 || ''}`);

await page.fill('[data-input="name"]', '민수');
await 종료();
await click('#host-btn');
await page.waitForSelector('.drawer');
await click('.drawer [data-act="resume"]');
await page.waitForSelector('.gacha-go', { timeout: 8000 });
assert((await page.inputValue('[data-input="name"]')) === '', '[이어서 뽑기] 후에도 입력란이 비어 있다');

console.log('\n▍결과 확인 후 자동 초기화');
await 종료();
await click('#home-btn');
await page.waitForSelector('.menu-card');
const 홈 = await screenText();
assert(!/중간 종료|지난 뽑기 결과|진행 중/.test(홈), '홈에 이전 가챠 상태가 남지 않는다');
await click('[data-go="gacha"]');
await page.waitForSelector('[data-act="start"]', { timeout: 8000 });
ok('다시 들어가면 숫자 개수 설정부터 시작한다');
assert(!(await page.evaluate(() => localStorage.getItem('numberBattle.gacha.v1'))),
  '저장소도 함께 비워진다');

console.log('\n▍진행 중에는 유지 (회귀 방지)');
const 총개수 = Number((await page.locator('.g-stepper-val').innerText()).trim());
await click('[data-act="start"]');
await 뽑기();
await click('[data-act="next"]');
await page.waitForSelector('.gacha-go');
await click('#home-btn');
await page.waitForSelector('.menu-card');
assert((await screenText()).includes('진행 중'), '진행 중인 가챠는 홈에 그대로 표시된다');
await click('[data-go="gacha"]');
await page.waitForSelector('.gacha-go', { timeout: 8000 });
const 남음 = (await page.locator('.g-counter b').innerText()).trim();
assert(남음 === String(총개수 - 1), `홈을 다녀와도 진행 상황이 유지된다 (${총개수}개 중 ${남음}개 남음)`);

await browser.close();

console.log(`\n${'─'.repeat(50)}`);
if (errors.length) {
  console.log('콘솔 오류:');
  errors.forEach((e) => console.log('  ', e));
}
console.log(`통과 ${pass} / 실패 ${실패.length}${errors.length ? ` / 콘솔 오류 ${errors.length}` : ''}`);
if (실패.length || errors.length) process.exit(1);
