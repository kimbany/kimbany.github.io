/**
 * worker.js — 스마트스토어 리뷰 수집 프록시 (Cloudflare Workers)
 *
 * 왜 필요한가: 브라우저에서 smartstore.naver.com 을 직접 fetch 하면 CORS로 막힌다.
 * GitHub Pages 는 정적 호스팅이라 서버가 없으므로 Workers 를 중계로 둔다.
 * (프록시 없이 쓰고 싶으면 index.html 의 "북마클릿 모드" 사용 — 상품 페이지에서
 *  직접 실행하므로 동일 출처라 CORS 문제가 아예 없다.)
 *
 * 환경변수 (Cloudflare > Settings > Variables):
 *   - ALLOWED_ORIGINS  쉼표 구분, 예: "https://kimbany.github.io"
 *                      (비워두면 * 로 개방 — 개발용)
 * API 키는 필요 없다. 네이버 로그인 없이 공개된 리뷰만 읽는다.
 *
 * 엔드포인트:
 *   GET  /health                       상태 확인
 *   GET  /product?url=<상품URL>        상품 메타 + 내부 ID 추출
 *   POST /reviews  {url, page, pageSize, sort}   리뷰 1페이지
 *   POST /collect  {url, pages, pageSize, sort}  리뷰 여러 페이지 한 번에
 */

// 네이버가 봇으로 보지 않도록 일반 브라우저와 동일한 헤더를 쓴다.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// 스마트스토어 계열에서 허용할 호스트 (SSRF 방지 — 임의 URL 중계 금지)
const ALLOWED_HOSTS = [
  "smartstore.naver.com",
  "m.smartstore.naver.com",
  "brand.naver.com",
  "m.brand.naver.com",
  "shopping.naver.com",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request.headers.get("Origin") || "", env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const path = url.pathname.replace(/\/$/, "") || "/";

      if (path === "/health") {
        return json({ ok: true, ts: new Date().toISOString() }, 200, cors);
      }

      if (path === "/product" && request.method === "GET") {
        const target = url.searchParams.get("url") || "";
        const info = await loadProduct(target);
        return json({ product: info.product, ids: info.ids }, 200, cors);
      }

      if (path === "/reviews" && request.method === "POST") {
        const req = await request.json();
        const info = await loadProduct(req.url || "");
        const page = await fetchReviewPage(
          info,
          num(req.page) || 1,
          num(req.pageSize) || 20,
          req.sort || "REVIEW_RANKING"
        );
        return json({ product: info.product, ids: info.ids, ...page }, 200, cors);
      }

      // 리뷰 사진 중계 — 네이버 이미지 CDN은 CORS 헤더를 안 줘서
      // 브라우저가 바이트를 못 읽는다(ZIP/폴더 저장 불가). 여기서 붙여준다.
      if (path === "/img" && request.method === "GET") {
        return await proxyImage(url.searchParams.get("url") || "", cors);
      }

      if (path === "/collect" && request.method === "POST") {
        const req = await request.json();
        const info = await loadProduct(req.url || "");
        const pageSize = num(req.pageSize) || 20;
        const sort = req.sort || "REVIEW_RANKING";
        const wanted = Math.min(num(req.pages) || 5, 50); // 과수집 방지 상한
        const reviews = [];
        let total = 0;
        let via = "";
        for (let p = 1; p <= wanted; p++) {
          const r = await fetchReviewPage(info, p, pageSize, sort);
          via = r.via || via;
          total = r.total || total;
          if (!r.reviews.length) break;
          reviews.push(...r.reviews);
          if (total && reviews.length >= total) break;
          await sleep(250); // 너무 빠른 연속 호출은 차단 위험 — 예의상 간격
        }
        return json(
          {
            source: "proxy",
            via,
            product: info.product,
            ids: info.ids,
            total,
            reviews,
            collectedAt: new Date().toISOString(),
          },
          200,
          cors
        );
      }

      return json({ error: "Not Found" }, 404, cors);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 502, cors);
    }
  },
};

/* ────────────────────────── 상품 페이지 파싱 ────────────────────────── */

// 상품 URL → HTML 내려받아 window.__PRELOADED_STATE__ 에서 메타·내부 ID 추출
async function loadProduct(rawUrl) {
  const target = normalizeProductUrl(rawUrl);
  const res = await fetch(target, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`상품 페이지 응답 ${res.status} — 링크를 확인하세요.`);
  const html = await res.text();

  const state = extractPreloadedState(html);
  if (!state) {
    throw new Error(
      "상품 데이터를 찾지 못했습니다. 네이버가 프록시 IP를 차단했을 수 있습니다(북마클릿 모드를 사용하세요)."
    );
  }

  const node = findProductNode(state) || {};
  const channel = node.channel || {};
  const amount = node.reviewAmount || {};

  const ids = {
    productNo: num(node.productNo) || num(node.id) || num(deepFind(state, "productNo")),
    originProductNo:
      num(node.originProductNo) || num(deepFind(state, "originProductNo")),
    channelNo: num(channel.channelNo) || num(deepFind(state, "channelNo")),
    merchantNo:
      num(channel.payReferenceKey) ||
      num(channel.accountNo) ||
      num(deepFind(state, "checkoutMerchantNo")) ||
      num(deepFind(state, "merchantNo")) ||
      num(deepFind(state, "naverPayAccountNo")),
    origin: new URL(target).origin,
    pageUrl: target,
  };

  const product = {
    name: node.name || deepFind(state, "productName") || "(상품명 미상)",
    storeName: channel.channelName || deepFind(state, "channelName") || "",
    image:
      node.representativeImageUrl ||
      (node.productImages && node.productImages[0] && node.productImages[0].url) ||
      deepFind(state, "representativeImageUrl") ||
      "",
    salePrice: num(node.salePrice) || num(node.discountedSalePrice) || 0,
    reviewCount:
      num(amount.totalReviewCount) || num(deepFind(state, "totalReviewCount")) || 0,
    averageScore:
      numF(amount.averageReviewScore) ||
      numF(deepFind(state, "averageReviewScore")) ||
      0,
    url: target,
  };

  return { product, ids };
}

// 모바일/트래킹 파라미터를 떼고 PC 상품 URL 로 정규화
function normalizeProductUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) throw new Error("상품 URL이 비어 있습니다.");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;

  let u;
  try {
    u = new URL(s);
  } catch {
    throw new Error("URL 형식이 올바르지 않습니다.");
  }

  const host = u.hostname.replace(/^m\./, "");
  if (!ALLOWED_HOSTS.includes(u.hostname) && !ALLOWED_HOSTS.includes(host)) {
    throw new Error(`지원하지 않는 도메인입니다: ${u.hostname}`);
  }
  u.hostname = host; // m.smartstore → smartstore
  u.search = ""; // ?NaPm=... 등 추적 파라미터 제거
  u.hash = "";
  return u.toString();
}

// <script>window.__PRELOADED_STATE__ = {...}</script> 에서 JSON 만 잘라낸다.
function extractPreloadedState(html) {
  for (const marker of ["window.__PRELOADED_STATE__", "__PRELOADED_STATE__"]) {
    const i = html.indexOf(marker);
    if (i < 0) continue;
    const start = html.indexOf("{", i + marker.length);
    if (start < 0) continue;
    const raw = sliceBalanced(html, start);
    try {
      return JSON.parse(raw);
    } catch {
      /* 다음 마커 시도 */
    }
  }
  return null;
}

// 문자열/이스케이프를 존중하며 중괄호 짝이 맞는 지점까지 잘라낸다.
function sliceBalanced(s, start) {
  let depth = 0,
    inStr = false,
    esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return s.slice(start);
}

// productNo + name 을 함께 가진 노드가 상품 상세. 스키마가 바뀌어도 버티도록 BFS.
function findProductNode(state) {
  const q = [state];
  let loose = null,
    seen = 0;
  while (q.length && seen < 50000) {
    const cur = q.shift();
    seen++;
    if (!cur || typeof cur !== "object") continue;
    if (!Array.isArray(cur) && cur.productNo && cur.name) {
      if (cur.channel) return cur;
      if (!loose) loose = cur;
    }
    for (const v of Object.values(cur)) if (v && typeof v === "object") q.push(v);
  }
  return loose;
}

// 객체 트리에서 특정 키의 첫 값을 찾는다 (스키마 드리프트 대비).
function deepFind(root, key) {
  const q = [root];
  let seen = 0;
  while (q.length && seen < 50000) {
    const cur = q.shift();
    seen++;
    if (!cur || typeof cur !== "object") continue;
    if (!Array.isArray(cur) && cur[key] != null && typeof cur[key] !== "object") {
      return cur[key];
    }
    for (const v of Object.values(cur)) if (v && typeof v === "object") q.push(v);
  }
  return null;
}

/* ────────────────────────── 리뷰 API 호출 ────────────────────────── */

// 리뷰 엔드포인트는 버전이 여러 개고 스토어 종류(스마트스토어/브랜드스토어)마다
// 통하는 게 다르다. 후보를 순서대로 시도해 첫 성공을 쓴다.
function reviewCandidates(ids, page, pageSize, sort) {
  const base = ids.origin;
  const list = [];

  if (ids.channelNo && ids.productNo) {
    list.push({
      via: "v2/channels",
      method: "GET",
      url:
        `${base}/i/v2/channels/${ids.channelNo}/products/${ids.productNo}` +
        `/contents/reviews?page=${page}&pageSize=${pageSize}&sortType=${sort}`,
    });
  }

  const body = {
    page,
    pageSize,
    reviewSearchSortType: sort,
    productNo: ids.productNo,
    originProductNo: ids.originProductNo || ids.productNo,
    channelNo: ids.channelNo,
    checkoutMerchantNo: ids.merchantNo,
    merchantNo: ids.merchantNo,
    isNeedPageInfo: true,
  };
  list.push({
    via: "v1/query-pages",
    method: "POST",
    url: `${base}/i/v1/contents/reviews/query-pages`,
    body,
  });

  if (ids.originProductNo && ids.originProductNo !== ids.productNo) {
    list.push({
      via: "v1/query-pages(origin)",
      method: "POST",
      url: `${base}/i/v1/contents/reviews/query-pages`,
      body: { ...body, productNo: ids.originProductNo },
    });
  }

  return list;
}

async function fetchReviewPage(info, page, pageSize, sort) {
  const errors = [];
  for (const c of reviewCandidates(info.ids, page, pageSize, sort)) {
    try {
      const res = await fetch(c.url, {
        method: c.method,
        headers: {
          "User-Agent": UA,
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9",
          "Referer": info.ids.pageUrl,
          "Origin": info.ids.origin,
          ...(c.body ? { "Content-Type": "application/json" } : {}),
        },
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      if (!res.ok) {
        errors.push(`${c.via}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const arr = pickReviewArray(data);
      if (!arr) {
        errors.push(`${c.via}: 리뷰 배열 없음`);
        continue;
      }
      return {
        via: c.via,
        page,
        total: num(deepFind(data, "totalElements")) || num(deepFind(data, "totalCount")) || 0,
        reviews: arr.map(normalizeReview),
      };
    } catch (e) {
      errors.push(`${c.via}: ${String((e && e.message) || e)}`);
    }
  }
  throw new Error("리뷰를 가져오지 못했습니다 — " + errors.join(" / "));
}

// 응답 어디에 있든 "리뷰처럼 생긴 객체들의 배열"을 찾는다.
function pickReviewArray(root) {
  const q = [root];
  let seen = 0;
  while (q.length && seen < 20000) {
    const cur = q.shift();
    seen++;
    if (!cur || typeof cur !== "object") continue;
    if (Array.isArray(cur)) {
      if (cur.length && cur.some(looksLikeReview)) return cur.filter(looksLikeReview);
      for (const v of cur) if (v && typeof v === "object") q.push(v);
      continue;
    }
    for (const v of Object.values(cur)) if (v && typeof v === "object") q.push(v);
  }
  return null;
}

function looksLikeReview(x) {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const hasText = "reviewContent" in x || "content" in x || "reviewBody" in x;
  const hasScore = "reviewScore" in x || "score" in x || "rating" in x;
  return hasText && hasScore;
}

// 리뷰 사진 URL 수집 — 필드명(attaches/reviewAttaches/mediaList/photoInfos…)이
// 제각각이라, 리뷰 객체 안의 "이미지처럼 생긴 문자열"을 전부 훑어 모은다.
const IMG_RE = /^(https?:)?\/\/[^\s"']+\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i;
const IMG_CDN = /^(https?:)?\/\/[a-z0-9.-]*phinf\.pstatic\.net\//i; // 확장자 없는 네이버 이미지
const IMG_SKIP = /(profile|avatar|blank|icon|logo|noimage|no_image)/i;
const isImgUrl = (s) => (IMG_RE.test(s) || IMG_CDN.test(s)) && !IMG_SKIP.test(s);

function collectImages(root) {
  const found = [];
  const q = [root];
  let seen = 0;
  while (q.length && seen < 5000) {
    const cur = q.shift();
    seen++;
    if (!cur || typeof cur !== "object") continue;
    for (const v of Object.values(cur)) {
      if (typeof v === "string") { if (isImgUrl(v)) found.push(v); }
      else if (v && typeof v === "object") q.push(v);
    }
  }
  // 프로토콜 보정 + 중복 제거 (같은 사진의 리사이즈 변형은 하나로 취급)
  const out = [], keys = new Set();
  for (let u of found) {
    if (u.startsWith("//")) u = "https:" + u;
    const key = u.split("?")[0];
    if (keys.has(key)) continue;
    keys.add(key);
    out.push(u);
  }
  return out;
}

// 필드명이 버전마다 달라 공통 스키마로 눕힌다. (북마클릿 출력과 동일한 모양)
function normalizeReview(r) {
  const imgs = collectImages(r);

  return {
    id: r.id || r.reviewId || r.reviewNo || null,
    score: numF(r.reviewScore ?? r.score ?? r.rating) || 0,
    content: String(r.reviewContent ?? r.content ?? r.reviewBody ?? "").trim(),
    date: String(
      r.createDate ?? r.registerDate ?? r.createdDate ?? r.writeDate ?? ""
    ).slice(0, 10),
    writer: r.writerMemberId || r.writerId || r.memberId || r.writerNickname || "",
    option: String(
      r.productOptionContent ?? r.optionContent ?? r.combinationOptionName ?? ""
    ).trim(),
    images: imgs,
    helpful: num(r.helpCount ?? r.likeCount ?? r.helpfulCount) || 0,
    reviewType: r.reviewType || r.qualityScore || "",
    sellerReply: replyOf(r),
  };
}

// 판매자 답변 — mallReview / commentContent / sellerComment … 자리가 제각각이다.
// "키 이름이 답변스러운 곳"만 훑어서 리뷰 본문과 섞이지 않게 한다.
const REPLY_KEY = /(mallreview|sellercomment|selleranswer|sellerreply|comment|reply|answer)/i;

function replyOf(r) {
  const direct = [
    r.mallReview && (r.mallReview.content || r.mallReview.commentContent),
    r.commentContent, r.sellerComment, r.sellerAnswer, r.answerContent, r.replyContent,
  ].find((v) => typeof v === "string" && v.trim());
  if (direct) return direct.trim();

  const q = [r];
  let n = 0;
  while (q.length && n < 3000) {
    const c = q.shift();
    n++;
    if (!c || typeof c !== "object") continue;
    for (const [k, v] of Object.entries(c)) {
      if (REPLY_KEY.test(k)) {
        if (typeof v === "string" && v.trim().length > 1 && !/^https?:/.test(v)) return v.trim();
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const s = v.content || v.commentContent || v.text || v.body;
          if (typeof s === "string" && s.trim()) return s.trim();
        }
        if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object") {
          const s = v[0].content || v[0].commentContent || v[0].text || v[0].body;
          if (typeof s === "string" && s.trim()) return s.trim();
        }
      }
      if (v && typeof v === "object") q.push(v);
    }
  }
  return "";
}

/* ────────────────────────── 이미지 중계 ────────────────────────── */

// 네이버 이미지 CDN만 허용 (열린 이미지 프록시가 되지 않도록)
const IMG_HOSTS = /(^|\.)(pstatic\.net|naver\.net|naver\.com)$/i;

async function proxyImage(raw, cors) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return json({ error: "이미지 URL이 올바르지 않습니다." }, 400, cors);
  }
  if (u.protocol !== "https:" || !IMG_HOSTS.test(u.hostname)) {
    return json({ error: `허용되지 않은 이미지 호스트: ${u.hostname}` }, 403, cors);
  }
  const res = await fetch(u.toString(), {
    headers: { "User-Agent": UA, "Referer": "https://smartstore.naver.com/" },
  });
  if (!res.ok) return json({ error: `이미지 응답 ${res.status}` }, res.status, cors);
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      ...cors,
    },
  });
}

/* ────────────────────────── 공통 유틸 ────────────────────────── */

function num(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}
function numF(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allow =
    allowed.length === 0 ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}
