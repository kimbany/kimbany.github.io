/**
 * 샤오홍슈 한국어 검색기 — Cloudflare Worker 백엔드
 *
 * 배포: Cloudflare Dashboard → Workers & Pages → Create Worker
 *      → "Edit code" 화면에 이 파일 내용 통째로 붙여넣고 Save and Deploy
 *
 * 엔드포인트:
 *   GET /search?q=<중국어 키워드>&ko=<원본 한국어>  → { items: [...] }
 *   GET /suggest?ko=<한국어 키워드>                 → { suggestions: [...] }
 *   GET /similar?id=<제품 id>                       → { items: [...] }
 *
 * 환경 변수 (Cloudflare Dashboard → Settings → Variables 에서 추가):
 *   OPENAI_API_KEY     — AI 추천 키워드용 (선택, 없으면 휴리스틱 사용)
 *   XHS_COOKIE         — 샤오홍슈 web_session 쿠키 (필수, 본인 계정에서 추출)
 *
 * ⚠️ 주의: 샤오홍슈 비공식 API라 차단 방식 바뀌면 동작 멈춤. 그때마다 업데이트 필요.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/search") return await handleSearch(url, env);
      if (url.pathname === "/suggest") return await handleSuggest(url, env);
      if (url.pathname === "/similar") return await handleSimilar(url, env);
      if (url.pathname === "/" || url.pathname === "/health") {
        return json({ ok: true, msg: "XHS 검색 백엔드 동작 중", endpoints: ["/search", "/suggest", "/similar"] });
      }
      return json({ error: "not found", path: url.pathname }, 404);
    } catch (e) {
      return json({ error: e.message, stack: e.stack }, 500);
    }
  },
};

// ===========================================================================
// /search — 샤오홍슈 검색
// ===========================================================================
async function handleSearch(url, env) {
  const zh = (url.searchParams.get("q") || "").trim();
  const ko = (url.searchParams.get("ko") || "").trim();
  if (!zh) return json({ error: "q (중국어 키워드) 필수" }, 400);

  // 샤오홍슈 웹 검색 페이지 직접 호출
  // 비공식 API. 차단 시 user-agent, cookie, headers를 조정해야 함.
  const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(zh)}&source=web_search_result_notes`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  };
  if (env.XHS_COOKIE) headers["Cookie"] = env.XHS_COOKIE;

  const r = await fetch(xhsUrl, { headers, redirect: "follow" });
  const html = await r.text();

  // 샤오홍슈 페이지에는 window.__INITIAL_STATE__ 라는 전역에 검색 결과 JSON이 박혀있음
  const items = extractItemsFromXhsHtml(html);

  return json({
    keyword: { zh, ko },
    count: items.length,
    items,
    debug: {
      htmlSize: html.length,
      hasCookie: !!env.XHS_COOKIE,
    },
  });
}

function extractItemsFromXhsHtml(html) {
  const items = [];
  // window.__INITIAL_STATE__ = {...};
  const m = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})\s*<\/script>/);
  if (m) {
    try {
      // XHS는 undefined를 JSON에 넣는 경우가 있어 ↓ 정리
      const cleaned = m[1].replace(/:\s*undefined/g, ": null");
      const state = JSON.parse(cleaned);
      const notes =
        (state.search && state.search.feeds && state.search.feeds._rawValue) ||
        (state.search && state.search.feeds) ||
        [];
      const list = Array.isArray(notes) ? notes : (notes.items || notes.list || []);
      for (const n of list.slice(0, 20)) {
        const note = n.noteCard || n.note_card || n;
        if (!note) continue;
        const cover =
          (note.cover && (note.cover.url || note.cover.urlDefault || note.cover.url_default)) ||
          (note.imageList && note.imageList[0] && note.imageList[0].url) ||
          "";
        items.push({
          id: note.id || note.noteId || n.id || "",
          title: note.displayTitle || note.title || note.desc || "",
          image: cover,
          author: (note.user && (note.user.nickname || note.user.nick_name)) || "",
          likes: (note.interactInfo && (note.interactInfo.likedCount || note.interactInfo.liked_count)) || "",
          url: note.id ? `https://www.xiaohongshu.com/explore/${note.id}` : "",
        });
      }
    } catch (e) {
      // 파싱 실패 — fallback 으로 raw 정규식
    }
  }

  // Fallback: html 안의 이미지/제목 정규식 추출 (정확도 낮음)
  if (items.length === 0) {
    const imgs = [...html.matchAll(/"(?:url|urlDefault|url_default)"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)]
      .map((m) => m[1].replace(/\\u002F/g, "/"))
      .slice(0, 20);
    imgs.forEach((u, i) => items.push({ id: "fallback-" + i, title: "(상세 정보 추출 실패)", image: u, url: "" }));
  }

  return items;
}

// ===========================================================================
// /suggest — 한국어 키워드 입력 → AI 추천 키워드 12개
// ===========================================================================
async function handleSuggest(url, env) {
  const ko = (url.searchParams.get("ko") || "").trim();
  if (!ko) return json({ suggestions: [] });

  if (env.OPENAI_API_KEY) {
    try {
      const list = await openAiSuggest(ko, env.OPENAI_API_KEY);
      if (list.length) return json({ suggestions: list, source: "openai" });
    } catch (e) {
      // fallthrough to heuristic
    }
  }
  return json({ suggestions: heuristicSuggest(ko), source: "heuristic" });
}

async function openAiSuggest(ko, apiKey) {
  const prompt = `사용자가 샤오홍슈(중국 SNS 쇼핑몰)에서 검색할 한국어 키워드: "${ko}"
이와 관련된 한국어 검색 키워드 12개를 추천해 주세요.
- 같은 카테고리의 다른 스타일·색상·소재
- 함께 코디하기 좋은 아이템
- 비슷한 가격대의 인기 검색어
형식: JSON 배열만, 짧은 키워드, 다른 말 없음. 예: ["키워드1", "키워드2", ...]`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) throw new Error("OpenAI HTTP " + r.status);
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content || "";
  // json_object 모드일 때 {"keywords": [...]} 같은 형식 가능
  const parsed = JSON.parse(content);
  const list = Array.isArray(parsed) ? parsed : (parsed.keywords || parsed.suggestions || parsed.list || []);
  return list.filter((x) => typeof x === "string").slice(0, 12);
}

function heuristicSuggest(ko) {
  // OpenAI 키 없을 때 폴백 — 키워드에 따라 그럴듯한 변형 생성
  const base = ko.split(/\s+/).filter(Boolean);
  const last = base[base.length - 1] || ko;
  const colors = ["블랙", "화이트", "베이지", "핑크", "그린"];
  const styles = ["미니멀", "빈티지", "캐주얼", "오버사이즈", "레이어드"];
  const seasons = ["가을", "겨울", "봄", "여름"];
  const out = new Set();
  colors.forEach((c) => out.add(`${c} ${last}`));
  styles.forEach((s) => out.add(`${s} ${last}`));
  seasons.forEach((s) => out.add(`${s} ${last}`));
  return [...out].slice(0, 12);
}

// ===========================================================================
// /similar — 다음 단계에서 구현 (제품 ID → 같은/비슷한 제품 검색)
// ===========================================================================
async function handleSimilar(url, env) {
  const id = url.searchParams.get("id") || "";
  return json({ todo: "다음 단계(이미지 유사도 + 추가 검색)에서 구현", id });
}
