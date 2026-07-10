/**
 * coupang.selftest.mjs — 키 없이 로직 검증 (체크리스트 D)
 *
 * 실호출은 인증키 발급 후. 이 자체테스트는 서명 포맷·조회구간 캡·정규화/데드라인만 검증.
 * 실행:  node workers/coupang.selftest.mjs
 * (crypto.subtle 은 Node 18+ globalThis.crypto 로 제공되어 Workers 와 동일하게 동작)
 */

import {
  쿠팡시각,
  쿠팡서명,
  조회구간,
  cs문의정규화,
  응답에서목록추출,
  문서ID,
  CS문의조회,
} from "./coupang.js";

let 실패 = 0;
function assert(조건, 설명) {
  if (조건) {
    console.log(`  ✅ ${설명}`);
  } else {
    console.error(`  ❌ ${설명}`);
    실패++;
  }
}

const 고정now = new Date(Date.UTC(2026, 6, 10, 3, 4, 5)); // 2026-07-10T03:04:05Z

console.log("1) 쿠팡 서명 시각 포맷 (yyMMddTHHmmssZ)");
{
  const t = 쿠팡시각(고정now);
  assert(t === "260710T030405Z", `시각='${t}'`);
}

console.log("2) HMAC 서명 결정성 + Authorization 헤더 구성");
{
  const a = await 쿠팡서명("GET", "/x/y", "a=1&b=2", "AK", "SK", 고정now);
  const b = await 쿠팡서명("GET", "/x/y", "a=1&b=2", "AK", "SK", 고정now);
  assert(a.authorization === b.authorization, "같은 입력→같은 서명(결정적)");
  assert(/^[0-9a-f]{64}$/.test(a.authorization.split("signature=")[1]), "서명=SHA-256 hex 64자");
  assert(a.authorization.startsWith("CEA algorithm=HmacSHA256, access-key=AK, "), "헤더 접두 구성");
  assert(a.authorization.includes("signed-date=260710T030405Z"), "signed-date 포함");
  const c = await 쿠팡서명("GET", "/x/y", "a=1&b=3", "AK", "SK", 고정now);
  assert(a.authorization !== c.authorization, "query 다르면 서명 달라짐");
}

console.log("3) 조회구간 7일 하드캡");
{
  const r = 조회구간(고정now, 30); // 30일 요청해도 7일로 제한
  const start = new Date(r.start + "+09:00");
  const end = new Date(r.end + "+09:00");
  const 일수 = (end - start) / (24 * 60 * 60 * 1000);
  assert(일수 <= 7, `구간 ${일수.toFixed(3)}일 ≤ 7일`);
  assert(r.end.includes("T") && r.start.includes("T"), "KST yyyy-MM-ddTHH:mm:ss 포맷");
}

console.log("4) CS문의 정규화 + 24h 데드라인");
{
  const mock = {
    inquiryId: 12345,
    content: "배송이 안 왔어요",
    sellerProductName: "지웨어 강아지 사료 2kg",
    customerName: "홍길동",
    inquiryAt: "2026-07-10T09:00:00+09:00",
  };
  const n = cs문의정규화(mock, 고정now);
  assert(n.market === "coupang" && n.marketType === "cs", "market/marketType 정규화");
  assert(n.marketInquiryId === "12345", "marketInquiryId 문자열화");
  assert(n.question === "배송이 안 왔어요", "question 매핑");
  assert(n.productName === "지웨어 강아지 사료 2kg", "productName 매핑");
  assert(n.status === "unanswered", "status 기본값");
  const dl = n.deadline.getTime() - n.createdAt.getTime();
  assert(dl === 24 * 60 * 60 * 1000, "deadline = createdAt + 24h");
  assert(문서ID(n) === "coupang_12345", "문서ID = market_inquiryId");
}

console.log("5) 응답 봉투 추출 (여러 형태 방어)");
{
  assert(응답에서목록추출({ content: [1, 2] }).length === 2, "content 배열");
  assert(응답에서목록추출({ data: [1] }).length === 1, "data 배열");
  assert(응답에서목록추출({ content: { inquiries: [1, 2, 3] } }).length === 3, "content.inquiries");
  assert(응답에서목록추출([9, 9]).length === 2, "배열 직접");
  assert(응답에서목록추출(null).length === 0, "null → 빈 배열");
}

console.log("6) CS문의조회: fetch 목킹으로 파이프라인 통합 검증");
{
  let 캡처URL = "", 캡처헤더 = null;
  const mockFetch = async (u, init) => {
    캡처URL = u;
    캡처헤더 = init.headers;
    return {
      status: 200,
      json: async () => ({ content: [{ inquiryId: 77, content: "문의내용", inquiryAt: "2026-07-10T00:00:00+09:00" }] }),
    };
  };
  const env = {
    COUPANG_ACCESS_KEY: "AK",
    COUPANG_SECRET_KEY: "SK",
    COUPANG_VENDOR_ID: "A00012345",
    COUPANG_BASE: "https://api-gateway.coupang.com",
  };
  const r = await CS문의조회(env, { now: 고정now, fetchImpl: mockFetch });
  assert(r.inquiries.length === 1 && r.inquiries[0].marketInquiryId === "77", "조회→정규화 1건");
  assert(캡처URL.includes("/vendors/A00012345/callCenterInquiries"), "URL 경로에 vendorId 포함");
  assert(캡처URL.includes("partnerCounselingStatus=NO_ANSWER"), "미답변 필터 쿼리");
  assert(캡처헤더.Authorization.startsWith("CEA algorithm=HmacSHA256"), "Authorization 헤더 부착");
}

console.log("");
if (실패 === 0) {
  console.log("🎉 전체 통과 — 쿠팡 CS문의 조회 로직 구조 검증 완료 (실호출은 키 발급 후).");
  process.exit(0);
} else {
  console.error(`💥 ${실패}건 실패`);
  process.exit(1);
}
