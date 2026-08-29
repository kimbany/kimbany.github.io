/* 가로 넘침(반응형) 회귀 테스트 — Playwright(Chromium) 필요
 *   node tests/layout.mjs        (사전에 저장소 루트에서 정적 서버 실행)
 *
 * 문서가 뷰포트보다 넓어지면 모바일 브라우저가 페이지 전체를 축소해 버린다.
 * 게임을 끝까지 진행하면서 매 화면의 scrollWidth 를 확인한다.
 *
 * 추가로 <select> 는 별도 검사한다. iOS WebKit 은 select 를 "가장 긴 option
 * 텍스트"보다 좁게 줄이지 않으므로, Chromium 에서 안 넘쳐도 iOS 에서는 넘칠 수 있다.
 */
import { chromium } from 'playwright';

const URL = process.env.NB_URL || 'http://127.0.0.1:8899/number-battle/index.html';
const WIDTHS = [320, 360, 375, 390, 430, 768];
const problems = [];

const browser = await chromium.launch();

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 780 } });
  const seen = new Set();

  async function checkOverflow(where) {
    const r = await page.evaluate(() => {
      const innerW = window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')].map((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) return null;
        if (b.right <= innerW + 0.5 && b.width <= innerW + 0.5) return null;
        const id = el.id ? `#${el.id}` : '';
        const cls = typeof el.className === 'string' && el.className
          ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
        return `${el.tagName}${id}${cls} w=${b.width.toFixed(0)} right=${b.right.toFixed(0)}`;
      }).filter(Boolean);
      return { innerW, docW: document.documentElement.scrollWidth, offenders };
    });
    if (r.docW > r.innerW + 0.5) {
      problems.push(`[${width}px] ${where}: 문서 폭 ${r.docW} > 뷰포트 ${r.innerW}\n      ${r.offenders.join('\n      ') || '(원인 요소 특정 실패)'}`);
    }
  }

  /** iOS WebKit 기준: select 는 가장 긴 option 텍스트만큼의 폭을 요구한다 */
  async function checkSelects(where) {
    const bad = await page.evaluate(() => {
      const out = [];
      for (const sel of document.querySelectorAll('select')) {
        const cs = getComputedStyle(sel);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const textW = Math.max(...[...sel.options].map((o) => ctx.measureText(o.textContent.trim()).width));
        const chrome = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
          + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) + 24; // 화살표 여유
        const needed = textW + chrome;
        const available = sel.parentElement.getBoundingClientRect().width;
        if (needed > available + 0.5) {
          out.push(`select[data-select=${sel.dataset.select}] 필요 ${needed.toFixed(0)}px > 사용가능 ${available.toFixed(0)}px`);
        }
      }
      return out;
    });
    for (const b of bad) problems.push(`[${width}px] ${where}: iOS 에서 넘칠 select — ${b}`);
  }

  async function snap(where) {
    const key = `${width}|${where}`;
    if (seen.has(key)) return;
    seen.add(key);
    await checkOverflow(where);
    await checkSelects(where);
  }

  const phase = () => page.evaluate(() => document.getElementById('phase-chip').textContent);
  const has = async (s) => (await page.locator(s).count()) > 0;
  const click = (s) => page.locator(s).first().click({ timeout: 8000 });
  const settle = async () => {
    await page.waitForFunction(() => !document.querySelector('#overlay-root .overlay'), null, { timeout: 20000 });
    await page.waitForTimeout(60);
  };

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  /* ---------- 홈 대메뉴 ---------- */
  await page.waitForSelector('.menu-card');
  await snap('홈 대메뉴');

  /* ---------- 가챠 뽑기 ---------- */
  await click('[data-go="gacha"]');
  await page.waitForSelector('[data-act="start"]');
  await snap('가챠 설정');
  await click('[data-act="names"]');
  for (let i = 11; i < 26; i += 1) await click('[data-step="1"]'); // 26개 (캡슐 많을 때)
  await snap('가챠 설정(26개)');
  await click('[data-act="start"]');
  await page.waitForSelector('.gacha-machine');
  await snap('가챠 기계');
  for (let i = 0; i < 3; i += 1) {
    await page.fill('[data-input="name"]', i === 0 ? '가나다라마바사아자차카' : `P${i}`);
    await click('.gacha-go');
    await page.waitForSelector('.co-number', { timeout: 15000 });
    await page.waitForTimeout(650);
    await snap('가챠 캡슐 공개');
    await click('[data-act="history"]');
    await snap('가챠 기록 펼침');
    await click('[data-act="next"]');
    await page.waitForSelector('.gacha-go');
    await snap('가챠 뽑기 대기');
  }
  await click('#host-btn');
  await page.waitForSelector('.drawer');
  await snap('가챠 진행자 메뉴');
  await click('.drawer [data-act="close"]');
  await click('#home-btn');
  await page.waitForSelector('.menu-card');
  await snap('홈(진행 중 표시)');

  /* ---------- 번호 쟁탈전 ---------- */
  await click('[data-go="battle"]');
  await page.waitForSelector('[data-act="start"]');
  await snap('SETUP');

  // 번호를 최대(가장 빡빡한 그리드)로 올려서 확인
  for (let i = 11; i < 30; i += 1) await click('[data-step="1"]');
  await snap('SETUP(번호 30개)');
  await click('[data-act="start"]');
  await page.waitForSelector('[data-input="name"]');

  const picks = [['가나다라마바사아자차카', 7], ['B', 7], ['C', 7], ['D', 7], ['E', 3], ['F', 3], ['현우', 1]];
  for (const [name, num] of picks) {
    await page.fill('[data-input="name"]', name);
    await snap('이름 입력');
    await click('[data-act="next"]');
    await page.waitForSelector('.num-grid');
    await snap('번호 선택');
    await click(`.num[data-number="${num}"]`);
    await click('[data-act="confirm"]');
    await page.waitForSelector('.modal');
    await snap('확인 팝업');
    await click('.modal [data-act="ok"]');
    await page.waitForSelector('.handoff');
    await snap('핸드오프');
    await click('[data-act="next"]');
    await page.waitForSelector('[data-input="name"]');
  }

  await click('#host-btn');
  await page.waitForSelector('.drawer');
  await snap('진행자 메뉴');
  await click('.drawer [data-act="fast"]');
  await click('.drawer [data-act="close-selection"]');
  await page.waitForSelector('.modal');
  await click('.modal [data-act="ok"]');
  await page.waitForSelector('.reveal-board', { timeout: 15000 });
  await snap('공개');
  await click('[data-act="all"]');
  await page.waitForSelector('[data-act="next"]');
  await snap('공개 완료');
  await click('[data-act="next"]');

  let guard = 0;
  let passed = false;
  while (await phase() !== '최종 결과') {
    if (guard++ > 250) throw new Error(`[${width}px] 진행 정지: ${await phase()}`);
    await settle();
    const p = await phase();
    if (p === '번호 쟁탈전' || p === 'FINAL 순위전') {
      if (await has('[data-act="go"]')) { await snap(`${p} VS`); await click('[data-act="go"]'); continue; }
      if (await has('.lt-action')) {
        await snap(`${p} 럭키타이밍`);
        await click('.lt-action'); await page.waitForTimeout(120 + Math.random() * 300);
        await click('.lt-action'); await page.waitForSelector('.lt-next');
        await snap(`${p} STOP`); continue;
      }
      if (await has('.lt-next')) { await click('.lt-next'); await page.waitForTimeout(140); continue; }
      if (await has('.fc-card:not([disabled])')) { await snap(`${p} 카드`); await click('.fc-card:not([disabled])'); await page.waitForTimeout(400); continue; }
      if (await has('.fc-open')) { await click('.fc-open'); await page.waitForTimeout(140); continue; }
      if (await has('[data-act="next"]')) { await snap(`${p} 결과`); await click('[data-act="next"]'); await page.waitForTimeout(140); continue; }
      throw new Error(`[${width}px] 쟁탈전 막힘`);
    }
    if (p === 'KEEP / PASS') {
      if (await has('[data-act="next"]')) { await snap('KEEP 확정'); await click('[data-act="next"]'); continue; }
      if (await has('.num-grid')) { await snap('PASS 번호 선택'); await click('.num-grid .num:not([disabled])'); continue; }
      await snap('KEEP/PASS 질문');
      if (!passed && await has('.kp-pass:not([disabled])')) { passed = true; await click('.kp-pass'); }
      else await click('[data-act="keep"]');
      continue;
    }
    if (p === '남은 번호 선택') { await snap('FINAL 번호 선택'); await click('.num-grid .num:not([disabled])'); continue; }
    throw new Error(`[${width}px] 예상 밖 단계: ${p}`);
  }
  await page.waitForSelector('.res-row');
  await page.waitForTimeout(700);
  await snap('최종 결과');
  await click('[data-act="log"]');
  await snap('진행 기록');

  /* ---------- 가챠 전부 소진 (완료 화면) ---------- */
  await click('#home-btn');
  await page.waitForSelector('.menu-card');
  await click('[data-go="gacha"]');
  await page.waitForSelector('.gacha-go, [data-act="again"]');
  let g = 0;
  while (await has('.gacha-go')) {
    if (g++ > 40) throw new Error(`[${width}px] 가챠가 끝나지 않음`);
    await click('.gacha-go');
    await page.waitForSelector('.co-number', { timeout: 15000 });
    await click('[data-act="next"]');
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('[data-act="again"]');
  await page.waitForTimeout(600);
  await snap('가챠 완료');
  await page.close();
  console.log(`  ✅ ${width}px — 모든 화면 검사 완료`);
}

await browser.close();

if (problems.length) {
  console.log(`\n❌ 가로 넘침 ${problems.length}건\n`);
  problems.forEach((p) => console.log('  · ' + p));
  process.exit(1);
}
console.log('\n✅ 모든 폭에서 가로 넘침 없음');
