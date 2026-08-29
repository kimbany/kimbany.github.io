/* 이름 입력(한글 IME) 회귀 테스트 — Playwright(Chromium) 필요
 *   node tests/name-input.mjs      (사전에 저장소 루트에서 정적 서버 실행)
 *
 * 배경: iOS Safari 는 `maxlength` 가 걸린 입력에서 한글을 조합할 때 마지막 음절을
 * 한 번 더 커밋한다. ("바니" → "바니니")
 * 그래서 ui.js 의 bindNameInput 은 maxlength 속성을 쓰지 않고, 조합이 끝난 뒤에만
 * 길이를 자른다. 가챠와 번호 쟁탈전이 같은 헬퍼를 쓴다.
 *
 * CDP 의 Input.imeSetComposition 으로 실제 조합 상태를 만들어 검증한다.
 * (iOS 고유 버그 자체는 여기서 재현할 수 없으므로, 원인이 된 maxlength 가
 *  사라졌는지와 조합 중 값이 올바로 확정되는지를 확인한다)
 */
import { chromium } from 'playwright';

const URL = process.env.NB_URL || 'http://127.0.0.1:8899/number-battle/index.html';

let pass = 0;
const 실패 = [];
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const cdp = await page.context().newCDPSession(page);
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const click = (s) => page.locator(s).first().click({ timeout: 8000 });
function ok(m) { pass += 1; console.log(`  ✅ ${m}`); }
function assert(cond, m) { if (cond) ok(m); else { 실패.push(m); console.log(`  ❌ ${m}`); } }

/** 한글 조합 단계를 그대로 재현한다. 마지막 단계는 조합 중인 채로 남는다. */
async function 조합(단계) {
  for (const t of 단계) {
    await cdp.send('Input.imeSetComposition', { text: t, selectionStart: t.length, selectionEnd: t.length });
    await page.waitForTimeout(60);
  }
}
const maxlengthOf = () => page.evaluate(() => document.querySelector('[data-input="name"]').getAttribute('maxlength'));

/* ---------------- 가챠 ---------------- */
console.log('\n▍가챠 이름 입력');
await page.goto(`${URL}#gacha`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-act="start"]');
await click('[data-act="names"]');
await click('[data-act="start"]');
await page.waitForSelector('[data-input="name"]');

assert((await maxlengthOf()) === null, 'maxlength 속성이 없다 (iOS 한글 중복 입력의 원인)');
assert(await page.evaluate(() => {
  const i = document.querySelector('[data-input="name"]');
  return i.getAttribute('autocorrect') === 'off' && i.getAttribute('autocapitalize') === 'off';
}), '자동 수정·대문자화가 꺼져 있다');

await page.click('[data-input="name"]');
await 조합(['ㅂ', '바', '반', '바니']);
assert((await page.inputValue('[data-input="name"]')) === '바니', '조합 중 입력란 값이 "바니"');
await click('.gacha-go');
await page.waitForSelector('.co-number', { timeout: 15000 });
assert((await page.locator('.g-result-who').innerText()).trim() === '바니',
  '조합 중에 뽑아도 결과 이름이 "바니" (중복 없음)');
await click('[data-act="next"]');
await page.waitForSelector('.gacha-go');

await page.click('[data-input="name"]');
await 조합(['ㅍ', '피', '픽', '피크']);
await click('.gacha-go');
await page.waitForSelector('.co-number', { timeout: 15000 });
assert((await page.locator('.g-result-who').innerText()).trim() === '피크', '두 번째도 "피크" (중복 없음)');
await click('[data-act="next"]');
await page.waitForSelector('.gacha-go');

await page.fill('[data-input="name"]', '가나다라마바사아자차카타파'); // 13자
await page.locator('[data-input="name"]').blur();
const 잘림 = await page.inputValue('[data-input="name"]');
assert(잘림.length === 12, `길이 제한은 조합이 끝난 뒤에 적용된다 (13자 → ${잘림.length}자)`);

/* ---------------- 번호 쟁탈전 ---------------- */
console.log('\n▍번호 쟁탈전 이름 입력');
await page.goto(`${URL}#battle`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-act="start"]');
await click('[data-act="start"]');
await page.waitForSelector('[data-input="name"]');

assert((await maxlengthOf()) === null, 'maxlength 속성이 없다');
await page.click('[data-input="name"]');
await 조합(['ㅎ', '현', '혀누', '현우']);
await click('[data-act="next"]');
await page.waitForSelector('.num-grid');
assert((await page.locator('.eyebrow').first().innerText()).trim().startsWith('현우 '),
  '조합 중에 넘어가도 이름이 "현우" (중복 없음)');

await browser.close();

console.log(`\n${'─'.repeat(50)}`);
if (errors.length) { console.log('콘솔 오류:'); errors.forEach((e) => console.log('  ', e)); }
console.log(`통과 ${pass} / 실패 ${실패.length}${errors.length ? ` / 오류 ${errors.length}` : ''}`);
if (실패.length || errors.length) process.exit(1);
