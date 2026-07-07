/**
 * worker.js — 네이버 오픈API 프록시 (Cloudflare Workers)
 *
 * 왜 필요한가: 네이버 검색/데이터랩 API는 브라우저 직접 호출이 CORS로 막혀 있고,
 * Client Secret을 프론트에 노출하면 안 된다. 이 Worker가 CORS를 우회하고
 * 인증 헤더를 서버 측에서 붙여 중계한다.
 *
 * 환경변수 (Cloudflare > Settings > Variables 에 등록, 하드코딩 금지):
 *   - NAVER_CLIENT_ID
 *   - NAVER_CLIENT_SECRET
 *   - ALLOWED_ORIGINS  (쉼표 구분, 예: "https://kimbany.github.io")
 *
 * 엔드포인트:
 *   GET  /search          → search/shop.json
 *   POST /datalab         → datalab/shopping/category/keywords
 *   POST /datalab-age     → datalab/shopping/category/keyword/age
 *   POST /datalab-gender  → datalab/shopping/category/keyword/gender
 *   POST /datalab-device  → datalab/shopping/category/keyword/device
 */

const NAVER = "https://openapi.naver.com/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    // CORS 프리플라이트
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const path = url.pathname.replace(/\/$/, "");
      let result;

      if (path === "/search" && request.method === "GET") {
        result = await proxySearch(url, env);
      } else if (path === "/datalab" && request.method === "POST") {
        result = await proxyDatalab("/datalab/shopping/category/keywords", request, env);
      } else if (path === "/datalab-age" && request.method === "POST") {
        result = await proxyDatalab("/datalab/shopping/category/keyword/age", request, env);
      } else if (path === "/datalab-gender" && request.method === "POST") {
        result = await proxyDatalab("/datalab/shopping/category/keyword/gender", request, env);
      } else if (path === "/datalab-device" && request.method === "POST") {
        result = await proxyDatalab("/datalab/shopping/category/keyword/device", request, env);
      } else {
        return json({ error: "Not Found" }, 404, cors);
      }

      return json(result.body, result.status, cors);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 502, cors);
    }
  },
};

// ---- 검색 API 중계 ----
async function proxySearch(url, env) {
  const query = url.searchParams.get("query") || "";
  const display = url.searchParams.get("display") || "40";
  const sort = url.searchParams.get("sort") || "sim"; // sim | date | asc | dsc
  const target = `${NAVER}/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
  const res = await fetch(target, { headers: naverHeaders(env) });
  return { status: res.status, body: await res.json() };
}

// ---- 데이터랩 중계 (POST 바디 그대로 전달) ----
async function proxyDatalab(apiPath, request, env) {
  const body = await request.text();
  const res = await fetch(NAVER + apiPath, {
    method: "POST",
    headers: { ...naverHeaders(env), "Content-Type": "application/json" },
    body,
  });
  return { status: res.status, body: await res.json() };
}

// ---- 공통 유틸 ----
function naverHeaders(env) {
  return {
    "X-Naver-Client-Id": env.NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET,
  };
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  // 허용 목록에 있으면 해당 오리진 반영, 목록이 비었으면 * 로 개방(개발용)
  const allow = allowed.length === 0 ? "*"
    : (allowed.includes(origin) ? origin : allowed[0]);
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
    headers: { "Content-Type": "application/json", ...cors },
  });
}
