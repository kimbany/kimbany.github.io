/**
 * coupang.js — 쿠팡 WING 오픈API 문의 수집 모듈 (Cloudflare Workers / Web Crypto)
 *
 * 이번 세션 범위(INITIAL_PROMPT C): HMAC 서명 유틸 + 쿠팡 CS문의(callCenterInquiries) 조회
 * + 통합 스키마 정규화 매퍼 + 24h 데드라인 계산. (답변 전송·상품문의는 다음 세션)
 *
 * 인증(검증된 스펙, CLAUDE.md 3-3):
 *   - HMAC-SHA256 서명. ACCESS_KEY + SECRET_KEY + VENDOR_ID(업체코드).
 *   - 서명 메시지에 요청시각(signed-date) 포함, 만료 짧음 → "signature is expired" 주의.
 *     반드시 요청 직전에 서명 생성.
 *   - Base URL: https://api-gateway.coupang.com
 *
 * ⚠️ 미확정(실제 응답으로 검증 필요, 지어내지 않음):
 *   - callCenterInquiries 응답의 개별 문의 필드명(작성일·상품명·고객명 등)은
 *     실호출 전까지 확정 불가 → 매퍼를 방어적으로(여러 후보 필드명 fallback) 작성하고
 *     raw 원본을 보존. 키 발급 후 실응답으로 필드명 고정할 것.
 *   - inquiryStartAt/inquiryEndAt 포맷은 KST "yyyy-MM-ddTHH:mm:ss" 로 구현.
 *     실호출로 확인 후 필요시 조정.
 */

const CS_INQUIRY_PATH_V5 = "/v2/providers/openapi/apis/api/v5/vendors"; // GET callCenterInquiries

// ─────────────────────────────────────────────────────────────
// 1) HMAC-SHA256 서명 (쿠팡 CEA 방식). 요청 직전 호출.
// ─────────────────────────────────────────────────────────────

/**
 * 쿠팡 서명용 시각 문자열 생성: GMT 기준 yyMMdd'T'HHmmss'Z'
 * @param {Date} [now] 테스트용 주입. 기본은 현재시각.
 */
export function 쿠팡시각(now) {
  const d = now || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    p(d.getUTCFullYear() % 100) +
    p(d.getUTCMonth() + 1) +
    p(d.getUTCDate()) +
    "T" +
    p(d.getUTCHours()) +
    p(d.getUTCMinutes()) +
    p(d.getUTCSeconds()) +
    "Z"
  );
}

/** HMAC-SHA256 → hex (쿠팡 서명 인코딩). Web Crypto(crypto.subtle) 사용 → Workers/Node18+ 공통. */
async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Authorization 헤더 생성.
 * 서명 메시지 = signed-date + method + path + query  (query 는 '?' 제외)
 * @returns {Promise<{authorization:string, datetime:string}>}
 */
export async function 쿠팡서명(method, path, query, accessKey, secretKey, now) {
  const datetime = 쿠팡시각(now);
  const message = datetime + method + path + query;
  const signature = await hmacHex(message, secretKey);
  const authorization =
    `CEA algorithm=HmacSHA256, access-key=${accessKey}, ` +
    `signed-date=${datetime}, signature=${signature}`;
  return { authorization, datetime };
}

// ─────────────────────────────────────────────────────────────
// 2) 조회 파라미터 유틸
// ─────────────────────────────────────────────────────────────

/** KST(UTC+9) 기준 "yyyy-MM-ddTHH:mm:ss" 포맷. inquiryStartAt/EndAt 용. */
export function kst문의시각(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return (
    kst.getUTCFullYear() +
    "-" +
    p(kst.getUTCMonth() + 1) +
    "-" +
    p(kst.getUTCDate()) +
    "T" +
    p(kst.getUTCHours()) +
    ":" +
    p(kst.getUTCMinutes()) +
    ":" +
    p(kst.getUTCSeconds())
  );
}

/**
 * 조회 구간 계산. 쿠팡 CS 조회는 최대 7일. 안전하게 (기본) 최근 7일 - 1분.
 * @returns {{start:string, end:string}} KST 포맷 문자열
 */
export function 조회구간(now, days = 7) {
  const end = now || new Date();
  const span = Math.min(days, 7); // 하드 캡: 7일 초과 금지
  const start = new Date(end.getTime() - span * 24 * 60 * 60 * 1000 + 60 * 1000);
  return { start: kst문의시각(start), end: kst문의시각(end) };
}

// ─────────────────────────────────────────────────────────────
// 3) CS문의(callCenterInquiries) 조회
// ─────────────────────────────────────────────────────────────

/**
 * 쿠팡 CS문의(콜센터 이관 건) 미답변 목록 조회.
 * GET /v2/providers/openapi/apis/api/v5/vendors/{vendorId}/callCenterInquiries
 *   쿼리: inquiryStartAt, inquiryEndAt(최대 7일), partnerCounselingStatus=NO_ANSWER, pageSize, pageNum
 *
 * @param {object} env  { COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY, COUPANG_VENDOR_ID, COUPANG_BASE }
 * @param {object} [opts] { pageNum, pageSize, days, now, fetchImpl }
 * @returns {Promise<{status:number, raw:any, inquiries:object[]}>} inquiries 는 통합 스키마 정규화 결과
 */
export async function CS문의조회(env, opts = {}) {
  const vendorId = env.COUPANG_VENDOR_ID;
  if (!vendorId) throw new Error("COUPANG_VENDOR_ID 미설정");

  const base = env.COUPANG_BASE || "https://api-gateway.coupang.com";
  const { start, end } = 조회구간(opts.now, opts.days || 7);
  const pageNum = opts.pageNum || 1;
  const pageSize = opts.pageSize || 50;

  const path = `${CS_INQUIRY_PATH_V5}/${vendorId}/callCenterInquiries`;
  // 서명 메시지의 query 와 실제 요청 query 는 반드시 동일 문자열이어야 함.
  const query =
    `inquiryStartAt=${encodeURIComponent(start)}` +
    `&inquiryEndAt=${encodeURIComponent(end)}` +
    `&partnerCounselingStatus=NO_ANSWER` +
    `&pageSize=${pageSize}` +
    `&pageNum=${pageNum}`;

  const { authorization } = await 쿠팡서명(
    "GET",
    path,
    query,
    env.COUPANG_ACCESS_KEY,
    env.COUPANG_SECRET_KEY,
    opts.now
  );

  const doFetch = opts.fetchImpl || fetch;
  const res = await doFetch(`${base}${path}?${query}`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
      "X-EXTENDED-Timeout": "90000",
    },
  });

  const raw = await res.json();
  const items = 응답에서목록추출(raw);
  const inquiries = items.map((it) => cs문의정규화(it, opts.now));
  return { status: res.status, raw, inquiries };
}

// ─────────────────────────────────────────────────────────────
// 4) 통합 스키마 정규화 (CLAUDE.md 4장)
// ─────────────────────────────────────────────────────────────

/** 응답 봉투에서 문의 배열을 방어적으로 추출. (content / data / 배열 직접 등 케이스 대비) */
export function 응답에서목록추출(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.content)) return raw.content;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.content && Array.isArray(raw.content.inquiries)) return raw.content.inquiries;
  if (Array.isArray(raw.inquiries)) return raw.inquiries;
  return [];
}

/** 여러 후보 필드명 중 처음으로 값이 있는 것을 반환. */
function 첫값(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
}

/**
 * 쿠팡 CS문의 1건 → 통합 스키마 문서.
 * ⚠️ 필드명은 실응답으로 확정 필요(위 상단 주의). 지금은 방어적 fallback.
 */
export function cs문의정규화(item, now) {
  const marketInquiryId = String(
    첫값(item, ["inquiryId", "csInquiryId", "id"]) ?? ""
  );
  const createdRaw = 첫값(item, ["inquiryAt", "createdAt", "receiptDate", "inquiryDate"]);
  const createdAt = createdRaw ? new Date(createdRaw) : null;

  // 쿠팡 CS 24h 데드라인: 작성일 + 24시간. (지나면 API 답변 불가 → 최우선 강조)
  const deadline =
    createdAt && !isNaN(createdAt.getTime())
      ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

  return {
    market: "coupang",
    marketType: "cs",
    marketInquiryId,
    productName: 첫값(item, ["sellerProductName", "productName", "displayProductName"]),
    productId: 첫값(item, ["sellerProductId", "productId", "vendorItemId"]),
    question: 첫값(item, ["content", "inquiryContent", "question", "csContent"]) || "",
    customerName: 첫값(item, ["customerName", "buyerName", "memberName"]),
    createdAt,
    status: "unanswered",
    draftAnswer: null,
    finalAnswer: null,
    answeredAt: null,
    deadline,
    raw: item,
  };
}

/** market + marketInquiryId 조합 → Firestore 문서 ID(중복수집 방지 키, CLAUDE.md 4장). */
export function 문서ID(정규화문의) {
  return `${정규화문의.market}_${정규화문의.marketInquiryId}`;
}
