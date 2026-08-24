import { chromium } from 'playwright';

const 오류 = [];
const 브라우저 = await chromium.launch();
const 페이지 = await 브라우저.newPage({ viewport: { width: 1440, height: 1000 } });
페이지.on('console', (m) => { if (m.type() === 'error') 오류.push(`콘솔: ${m.text()}`); });
페이지.on('pageerror', (e) => 오류.push(`예외: ${e.message}`));

await 페이지.goto('file:///home/user/kimbany.github.io/channel-status/index.html');
await 페이지.waitForTimeout(400);

const 단계 = async (이름, 동작) => {
  const 이전 = 오류.length;
  try { await 동작(); await 페이지.waitForTimeout(250); }
  catch (e) { 오류.push(`${이름} 실패: ${e.message}`); }
  console.log(`${오류.length > 이전 ? '✗' : '✓'} ${이름}`);
};

await 단계('데일리 화면', async () => {
  const 변동수 = await 페이지.locator('#오늘변동목록 > div').count();
  const 예약 = await 페이지.locator('[data-예약완료]').count();
  console.log(`   오늘 변동 상품 ${변동수}개 · 예약 알림 ${예약}건`);
});

await 단계('변동 현황', async () => {
  await 페이지.click('[data-화면="변동"]');
  const 채널박스 = await 페이지.locator('#변동-결과 > div').count();
  console.log(`   채널 그룹 ${채널박스}개`);
});
await 단계('변동 유형 필터 토글', async () => { await 페이지.click('.유형칩'); await 페이지.click('.유형칩'); });

await 단계('채널 현황 매트릭스', async () => {
  await 페이지.click('[data-화면="채널"]');
  const 행 = await 페이지.locator('#현황표 tbody tr').count();
  const 열 = await 페이지.locator('#현황표 thead th').count();
  console.log(`   표 ${행}행 × ${열}열`);
});
await 단계('빠른 날짜 · 검색 · 상태필터', async () => {
  await 페이지.click('[data-빠른="7일"]');
  await 페이지.fill('#현황-검색', 'MF-APL');
  await 페이지.selectOption('#현황-상태필터', '판매중지');
  await 페이지.fill('#현황-검색', '');
  await 페이지.selectOption('#현황-상태필터', '');
});
await 단계('접기/펼치기', async () => {
  await 페이지.click('#현황-모두접기');
  await 페이지.click('#현황-모두펼치기');
  await 페이지.locator('[data-접기]').first().click();
});
await 단계('채널별 보기 전환', async () => {
  const 값 = await 페이지.locator('#현황-채널선택 option').nth(2).getAttribute('value');
  await 페이지.selectOption('#현황-채널선택', 값);
  await 페이지.selectOption('#현황-채널선택', '');
});

await 단계('예약 등록', async () => {
  await 페이지.click('[data-하위="예약"]');
  const 코드 = await 페이지.locator('#상품코드목록 option').first().getAttribute('value');
  await 페이지.fill('#예약-상품코드', 코드);
  await 페이지.click('#예약-전체채널');
  await 페이지.click('#예약-저장');
  const 건수 = await 페이지.locator('[data-예약수정]').count();
  console.log(`   예약 목록 ${건수}건`);
});
await 단계('예약 수정', async () => {
  await 페이지.locator('[data-예약수정]').first().click();
  await 페이지.fill('#예약-메모', '수정테스트');
  await 페이지.click('#예약-저장');
});

for (const [탭, 이름] of [['채널','채널 관리'],['상품','상품 마스터'],['매핑','ID 매핑'],['수집','데이터 수집'],['기타','기타']]) {
  await 단계(`설정 › ${이름}`, async () => {
    await 페이지.click('[data-화면="설정"]');
    await 페이지.click(`[data-설정="${탭}"]`);
  });
}

await 단계('상태 매핑 모달', async () => {
  await 페이지.click('[data-설정="채널"]');
  await 페이지.locator('[data-채널매핑]').first().click();
  await 페이지.fill('#매핑입력', '판매종료=판매중지\n재고소진=품절');
  await 페이지.click('#매핑저장');
});
await 단계('상품 편집 모달', async () => {
  await 페이지.click('[data-설정="상품"]');
  await 페이지.locator('[data-상품수정]').first().click();
  await 페이지.click('#편집-저장');
});
await 단계('채널 추가/삭제', async () => {
  await 페이지.click('[data-설정="채널"]');
  await 페이지.fill('#새채널-표기', '테스트_TT');
  await 페이지.fill('#새채널-키', 'test_tt');
  await 페이지.click('#새채널-추가');
  페이지.once('dialog', (d) => d.accept());
  await 페이지.click('[data-채널삭제="test_tt"]');
});

await 페이지.click('[data-화면="데일리"]');
await 페이지.screenshot({ path: `${process.env.S}/데일리.png`, fullPage: true });
await 페이지.click('[data-화면="채널"]');
await 페이지.waitForTimeout(300);
await 페이지.screenshot({ path: `${process.env.S}/채널현황.png`, fullPage: true });
await 페이지.click('[data-화면="변동"]');
await 페이지.waitForTimeout(300);
await 페이지.screenshot({ path: `${process.env.S}/변동현황.png`, fullPage: true });

await 브라우저.close();
console.log(오류.length ? `\n오류 ${오류.length}건:\n` + 오류.join('\n') : '\n오류 없음');
process.exit(오류.length ? 1 : 0);
