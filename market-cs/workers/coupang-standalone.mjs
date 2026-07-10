/**
 * coupang-standalone.mjs — 쿠팡 CS문의 실호출 검증 (단독 실행, git·import 불필요)
 *
 * 이 파일 하나만 다운로드해서 본인 PC에서 실행. (WING에 IP 등록된 PC에서)
 *
 * 실행 (PowerShell):
 *   $env:COUPANG_ACCESS_KEY="발급키"
 *   $env:COUPANG_SECRET_KEY="발급키"
 *   $env:COUPANG_VENDOR_ID="A00012345"
 *   node coupang-test.mjs
 *
 * 결과의 "원본 raw JSON" 을 복사해서 전달 → 응답 필드명 확정에 사용.
 */

const BASE = process.env.COUPANG_BASE || "https://api-gateway.coupang.com";
const PATH_V5 = "/v2/providers/openapi/apis/api/v5/vendors";

// ── 쿠팡 서명 시각: GMT yyMMdd'T'HHmmss'Z' ──
function 쿠팡시각(now) {
  const d = now || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    p(d.getUTCFullYear() % 100) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) +
    "T" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + "Z"
  );
}

// ── HMAC-SHA256 → hex ──
async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── CEA Authorization 헤더 ──
async function 쿠팡서명(method, path, query, accessKey, secretKey) {
  const datetime = 쿠팡시각();
  const signature = await hmacHex(datetime + method + path + query, secretKey);
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

// ── KST yyyy-MM-ddTHH:mm:ss ──
function kst(date) {
  const k = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return k.getUTCFullYear() + "-" + p(k.getUTCMonth() + 1) + "-" + p(k.getUTCDate()) +
    "T" + p(k.getUTCHours()) + ":" + p(k.getUTCMinutes()) + ":" + p(k.getUTCSeconds());
}

// ── 실행 ──
const AK = process.env.COUPANG_ACCESS_KEY;
const SK = process.env.COUPANG_SECRET_KEY;
const VID = process.env.COUPANG_VENDOR_ID;

for (const [name, v] of [["COUPANG_ACCESS_KEY", AK], ["COUPANG_SECRET_KEY", SK], ["COUPANG_VENDOR_ID", VID]]) {
  if (!v) {
    console.error(`❌ 환경변수 ${name} 가 없습니다. 위 주석의 준비 단계를 확인하세요.`);
    process.exit(1);
  }
}

const now = new Date();
const end = kst(now);
const start = kst(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 1000)); // 최근 7일
const path = `${PATH_V5}/${VID}/callCenterInquiries`;
const query =
  `inquiryStartAt=${encodeURIComponent(start)}` +
  `&inquiryEndAt=${encodeURIComponent(end)}` +
  `&partnerCounselingStatus=NO_ANSWER&pageSize=10&pageNum=1`;

console.log("→ 쿠팡 CS문의(미답변) 조회 중... (최근 7일)");
try {
  const authorization = await 쿠팡서명("GET", path, query, AK, SK);
  const res = await fetch(`${BASE}${path}?${query}`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
      "X-EXTENDED-Timeout": "90000",
    },
  });
  const raw = await res.json();
  console.log(`HTTP ${res.status}\n`);
  console.log("── 원본 raw (이 부분을 그대로 복사해 주세요) ──");
  console.log(JSON.stringify(raw, null, 2));
  if (res.status !== 200) {
    console.error("\n⚠️ 200이 아닙니다. 흔한 원인: IP 미등록 / signature is expired(PC 시계) / 키 오타 / 권한 미승인.");
  }
} catch (e) {
  console.error("💥 호출 실패:", (e && e.message) || e);
  process.exit(1);
}
