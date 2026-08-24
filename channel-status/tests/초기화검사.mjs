import { chromium } from 'playwright';
const 브라우저 = await chromium.launch();
const 페이지 = await 브라우저.newPage();
const 오류 = [];
페이지.on('pageerror', (e) => 오류.push(e.message));
await 페이지.goto('file:///home/user/kimbany.github.io/channel-status/index.html');
await 페이지.waitForTimeout(300);
console.log('첫 방문 데모 상품:', await 페이지.evaluate(() => 상품목록(false).length));

await 페이지.click('[data-화면="설정"]');
await 페이지.click('[data-설정="기타"]');
페이지.once('dialog', (d) => d.accept());
await 페이지.click('#기타-전체삭제');
await 페이지.waitForTimeout(300);
const 삭제후 = await 페이지.evaluate(() => ({ 상품: 상품목록(false).length, 채널: 채널목록().length }));
console.log('초기화 직후:', JSON.stringify(삭제후));

await 페이지.reload();
await 페이지.waitForTimeout(400);
const 새로고침후 = await 페이지.evaluate(() => ({ 상품: 상품목록(false).length, 채널: 채널목록().length }));
console.log('새로고침 후:', JSON.stringify(새로고침후));

const 통과 = 삭제후.상품 === 0 && 새로고침후.상품 === 0 && 새로고침후.채널 === 10;
console.log(통과 ? '✓ 초기화가 새로고침 후에도 유지되고 채널 10개는 복구됨' : '✗ 초기화 유지 실패');
await 브라우저.close();
process.exit(통과 && !오류.length ? 0 : 1);
