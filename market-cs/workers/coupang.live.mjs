/**
 * coupang.live.mjs — 쿠팡 CS문의 실호출 검증 (본인 PC에서 실행)
 *
 * ⚠️ 이 컨테이너가 아니라 "WING에 IP 등록한 본인 PC"에서 실행할 것.
 *    쿠팡 API는 호출 IP 등록을 요구하므로, 등록 안 된 IP는 막힘.
 *
 * 준비:
 *   1) WING > 판매자정보 > 추가판매정보 > API Key 발급 (ACCESS/SECRET/VENDOR)
 *   2) 본인 PC의 공인 IP 를 WING 에 등록 (whatismyip 등으로 확인)
 *   3) 키는 코드가 아니라 환경변수로 (하드코딩 금지):
 *
 *   macOS/Linux:
 *     export COUPANG_ACCESS_KEY=...
 *     export COUPANG_SECRET_KEY=...
 *     export COUPANG_VENDOR_ID=A00012345
 *     node workers/coupang.live.mjs
 *
 *   Windows(PowerShell):
 *     $env:COUPANG_ACCESS_KEY="..."; $env:COUPANG_SECRET_KEY="..."; $env:COUPANG_VENDOR_ID="A00012345"
 *     node workers/coupang.live.mjs
 *
 * 결과: 정규화된 미답변 CS문의 + (원본 raw) 를 출력.
 *   → 이 raw JSON 을 그대로 복사해 주면 응답 필드명(작성일/상품명/고객명 등)을 확정함.
 */

import { CS문의조회 } from "./coupang.js";

const env = {
  COUPANG_ACCESS_KEY: process.env.COUPANG_ACCESS_KEY,
  COUPANG_SECRET_KEY: process.env.COUPANG_SECRET_KEY,
  COUPANG_VENDOR_ID: process.env.COUPANG_VENDOR_ID,
  COUPANG_BASE: process.env.COUPANG_BASE || "https://api-gateway.coupang.com",
};

for (const k of ["COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY", "COUPANG_VENDOR_ID"]) {
  if (!env[k]) {
    console.error(`❌ 환경변수 ${k} 가 없습니다. 위 주석의 준비 단계를 확인하세요.`);
    process.exit(1);
  }
}

console.log("→ 쿠팡 CS문의(미답변) 조회 중... (최근 7일)");
try {
  const r = await CS문의조회(env, { pageSize: 10, pageNum: 1 });
  console.log(`HTTP ${r.status} / 정규화 ${r.inquiries.length}건\n`);

  console.log("── 정규화 결과 (통합 스키마) ──");
  console.log(
    JSON.stringify(
      r.inquiries.map((i) => ({
        marketInquiryId: i.marketInquiryId,
        question: i.question,
        productName: i.productName,
        customerName: i.customerName,
        createdAt: i.createdAt,
        deadline: i.deadline,
      })),
      null,
      2
    )
  );

  console.log("\n── 원본 raw (이 부분을 그대로 복사해 주세요) ──");
  console.log(JSON.stringify(r.raw, null, 2));

  if (r.status !== 200) {
    console.error(
      "\n⚠️ 200이 아닙니다. 흔한 원인: IP 미등록 / signature is expired(시각 문제) / 키 오타 / 권한 미승인."
    );
  }
} catch (e) {
  console.error("💥 호출 실패:", (e && e.message) || e);
  console.error("   네트워크·IP 등록·키를 확인하세요.");
  process.exit(1);
}
