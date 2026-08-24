import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const 기준 = '/home/user/kimbany.github.io/channel-status/samples';
const 읽기 = (이름) => readFileSync(`${기준}/${이름}`, 'utf8');

const 브라우저 = await chromium.launch();
const 페이지 = await 브라우저.newPage({ viewport: { width: 1440, height: 1000 } });
const 오류 = [];
페이지.on('pageerror', (e) => 오류.push(e.message));
await 페이지.goto('file:///home/user/kimbany.github.io/channel-status/index.html');
await 페이지.waitForTimeout(300);

// 데모를 비우고 샘플 CSV 만으로 처음부터 세팅한다
await 페이지.evaluate(() => { localStorage.removeItem(저장키); 저장소.캐시 = null; 채널초기화(); 설정쓰기('자동데모완료', true); });
await 페이지.reload();
await 페이지.waitForTimeout(300);

// 파일 선택 대화상자만 대체한다 — 나머지 경로(파싱·병합·미리보기·저장)는 그대로 탄다
const 다음파일 = async (내용) => 페이지.evaluate((내용) => { window.파일읽기 = async () => 내용; }, 내용);

await 페이지.click('[data-화면="설정"]');
await 페이지.click('[data-설정="상품"]');
await 다음파일(읽기('상품마스터.csv'));
await 페이지.click('#상품-CSV업로드');
await 페이지.waitForTimeout(300);
const 상품수 = await 페이지.evaluate(() => 상품목록(false).length);
console.log(`${상품수 === 3 ? '✓' : '✗'} 상품 마스터 업로드 — ${상품수}건 (기대 3)`);

await 페이지.click('[data-설정="수집"]');
await 다음파일(읽기('상태_가로형.csv'));
await 페이지.click('#수집-업로드');
await 페이지.waitForTimeout(300);
console.log(`${await 페이지.locator('#업로드-확정').isVisible() ? '✓' : '✗'} 저장 전 확인 모달 표시`);
await 페이지.click('#업로드-확정');
await 페이지.waitForTimeout(300);
const 가로 = await 페이지.evaluate(() => 상태맵(오늘KST()).상태['MF-APL-G-3000G-0712']);
console.log('  가로형 반영:', JSON.stringify(가로));

await 페이지.click('[data-설정="수집"]');
await 다음파일(읽기('상태_세로형.csv'));
await 페이지.click('#수집-업로드');
await 페이지.waitForTimeout(300);
await 페이지.click('#업로드-확정');
await 페이지.waitForTimeout(300);

const 결과 = await 페이지.evaluate(() => ({
  상태: 상태맵(오늘KST()).상태['MF-APL-G-3000G-0712'],
  둘째: 상태맵(오늘KST()).상태['MF-APL-G-5000G-0713'],
  미매핑: 설정읽기('미매핑', {}),
  변동: 변동목록(오늘KST()).length,
  회차: Object.keys(저장소.읽기('회차', 오늘KST()) ?? {}).length,
}));
console.log('  세로형 반영 후:', JSON.stringify(결과.상태));

const 검사 = [
  ['올린 채널만 갱신 (11번가 판매중 → 품절)', 결과.상태.st11 === '품절'],
  ['안 올린 채널 값 유지 (SSG 판매중)', 결과.상태.ssg === '판매중'],
  ['가로형의 판매중지도 유지 (알리)', 결과.상태.ali === '판매중지'],
  ['채널ID 없으면 미등록 (0713 토스)', 결과.둘째.toss_gy === '미등록'],
  ['"판매종료" → 판매중지로 정규화', 결과.둘째.ss_mo === '판매중지'],
  ['미매핑 없음', Object.keys(결과.미매핑).length === 0],
  ['변동 누적됨', 결과.변동 > 0],
  ['같은 날 회차 2건', 결과.회차 === 2],
];
검사.forEach(([이름, 통과]) => console.log(`${통과 ? '✓' : '✗'} ${이름}`));

await 페이지.click('[data-화면="데일리"]');
await 페이지.waitForTimeout(300);
console.log(`✓ 데일리 변동 상품 ${await 페이지.locator('#오늘변동목록 > div').count()}개`);

await 브라우저.close();
const 실패 = 검사.filter(([, t]) => !t).length + (상품수 === 3 ? 0 : 1);
console.log(오류.length ? `\n예외: ${오류.join(' | ')}` : '\n예외 없음');
process.exit(실패 || 오류.length ? 1 : 0);
