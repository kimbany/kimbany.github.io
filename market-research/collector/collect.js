/**
 * collect.js — 네이버쇼핑 키워드 순위/가격 수집기 (방식 B: 크롬 화면 수집)
 *
 * 왜 이게 필요한가:
 *   네이버 쇼핑 검색 오픈API가 2026-07-31 종료(SE05)되어 대시보드가 상품 데이터를
 *   직접 못 가져온다. 그래서 "진짜 크롬 브라우저"로 네이버쇼핑 검색 화면을 열어
 *   상품 목록(순위·가격·판매처)을 긁어 Firebase(Firestore)에 저장한다.
 *   대시보드는 Firebase를 읽어 '순위추적' / '가격경쟁력(네이버 채널)'을 보여준다.
 *
 * 흐름:
 *   [이 스크립트(내 PC)] → 네이버쇼핑 검색 → 상품목록 파싱 → Firestore(trk 컬렉션) 저장
 *   [대시보드(invedory.com)] → Firestore 읽기 → 어제 vs 오늘 비교 표시
 *
 * 준비물 (README.md 참고):
 *   1) Node.js 18+ 설치
 *   2) 이 폴더에서  npm install   (playwright + firebase-admin)
 *   3) npx playwright install chromium
 *   4) config.json  작성 (config.example.json 복사)
 *   5) serviceAccount.json  배치 (Firebase 콘솔 > 서비스 계정 > 비공개 키)
 *   6) node collect.js
 *
 * 옵션:
 *   node collect.js --dry       Firebase 저장 안 함(화면 긁기만 테스트, raw만 저장)
 *   node collect.js --headless  창 안 띄우고 실행(봇차단 더 잘 걸릴 수 있음, 비권장)
 */

const fs = require("fs");
const path = require("path");

// ---- 인자 ----
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry");           // Firebase 저장 생략
const HEADLESS = ARGS.includes("--headless");  // 창 숨김(기본은 창 띄움=봇차단 완화)

// ---- 설정 로드 ----
const CFG_PATH = path.join(__dirname, "config.json");
if (!fs.existsSync(CFG_PATH)) {
  console.error("❌ config.json 이 없습니다. config.example.json 을 복사해 만드세요.");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
const KEYWORDS = Array.isArray(cfg.keywords) ? cfg.keywords.filter(Boolean) : [];
const TOP_N = Math.min(Number(cfg.topN) || 40, 80);
const OURS = (cfg.ours || {}); // { "키워드": ["내상품ID", ...] } 또는 { "_mall": "내스토어명" }
const MY_MALL = (cfg.myMall || "").trim(); // 내 스마트스토어 상호(순위 'ours' 표시용)

if (!KEYWORDS.length) {
  console.error("❌ config.json 의 keywords 가 비어있습니다.");
  process.exit(1);
}

// ---- 날짜 (KST 기준 YYYY-MM-DD) ----
function todayKST() {
  const now = new Date(Date.now() + 9 * 3600 * 1000); // UTC+9
  return now.toISOString().slice(0, 10);
}
const TODAY = todayKST();

// ---- raw 저장 폴더 (디버깅/파서 보정용) ----
const RAW_DIR = path.join(__dirname, "raw");
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

// ---- Firebase (admin) 준비 ----
let db = null;
if (!DRY) {
  const SVC_PATH = path.join(__dirname, "serviceAccount.json");
  if (!fs.existsSync(SVC_PATH)) {
    console.error("❌ serviceAccount.json 이 없습니다. (--dry 로 저장 없이 테스트 가능)");
    console.error("   Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > '새 비공개 키 생성' → 이 폴더에 serviceAccount.json 으로 저장");
    process.exit(1);
  }
  const admin = require("firebase-admin");
  const svc = require(SVC_PATH);
  admin.initializeApp({ credential: admin.credential.cert(svc) });
  db = admin.firestore();
}

// ============================================================
//  메인
// ============================================================
(async () => {
  const { chromium } = require("playwright");
  console.log(`\n네이버쇼핑 수집 시작 · ${TODAY} · 키워드 ${KEYWORDS.length}개 · 상위 ${TOP_N}개${DRY ? " · [DRY: 저장안함]" : ""}`);

  // 진짜 크롬 프로필처럼 보이게 persistent context 사용 (봇차단 완화)
  const userDataDir = path.join(__dirname, ".chrome-profile");
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: HEADLESS,
    viewport: { width: 1360, height: 900 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  });

  const page = ctx.pages()[0] || (await ctx.newPage());
  let okCount = 0, failCount = 0;

  for (const kw of KEYWORDS) {
    try {
      process.stdout.write(`\n[${kw}] 수집 중… `);
      const { items, blocked } = await collectKeyword(page, kw, TOP_N);

      if (blocked) {
        console.log("⚠ 봇 확인 화면/차단 감지 — 건너뜀 (raw 확인)");
        failCount++;
      } else if (!items.length) {
        console.log("⚠ 상품 0개 — 파싱 실패 가능 (raw 확인)");
        failCount++;
      } else {
        // 'ours'(내 상품) 표시
        markOurs(items, kw);
        const snap = { date: TODAY, keyword: kw, items };
        if (!DRY) {
          await db.collection("trk").doc(`${kw}__${TODAY}`).set({ kw, date: TODAY, snap });
        }
        const mine = items.filter((x) => x.ours);
        console.log(`✅ ${items.length}개${mine.length ? ` (내상품 ${mine[0].rank}위)` : ""}${DRY ? " [미저장]" : " → Firebase 저장"}`);
        okCount++;
      }
    } catch (e) {
      console.log(`❌ 실패: ${e.message}`);
      failCount++;
    }
    // 사람처럼 랜덤 간격 (연속 호출 차단 완화)
    await page.waitForTimeout(2500 + Math.floor(Math.random() * 3500));
  }

  await ctx.close();
  console.log(`\n\n끝. 성공 ${okCount} · 실패/스킵 ${failCount}`);
  if (failCount && okCount === 0) {
    console.log("모두 실패했어요. market-research/collector/raw/ 안의 JSON을 Claude에게 보내면 파서를 고쳐줍니다.");
  }
  process.exit(0);
})().catch((e) => {
  console.error("\n치명적 오류:", e);
  process.exit(1);
});

// ============================================================
//  키워드 1개 수집
// ============================================================
async function collectKeyword(page, kw, topN) {
  const captured = [];
  // 네이버쇼핑 내부 API(JSON) 응답을 가로채 둔다 (DOM보다 안정적)
  const onResp = async (res) => {
    const u = res.url();
    if (/shopping\.naver\.com\/api\/search/i.test(u) || /\/api\/.*(search|products)/i.test(u)) {
      try {
        const j = await res.json();
        captured.push({ url: u, json: j });
      } catch (_) {}
    }
  };
  page.on("response", onResp);

  const url =
    `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(kw)}` +
    `&pagingIndex=1&pagingSize=${Math.min(topN, 80)}&productSet=total&sort=rel`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3500);

  // 봇 확인 화면 감지
  const bodyText = (await page.evaluate(() => document.body?.innerText || "").catch(() => "")) || "";
  const blocked =
    /로봇|자동.*입력|비정상적|captcha|caution|일시적으로 제한/i.test(bodyText) &&
    bodyText.length < 1500;

  // lazy 로딩 유도: 천천히 스크롤
  if (!blocked) {
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 1800);
      await page.waitForTimeout(600 + Math.floor(Math.random() * 500));
    }
    await page.waitForTimeout(1200);
  }

  // Next.js SSR 데이터( __NEXT_DATA__ ) 추출
  let nextData = null;
  try {
    nextData = await page.evaluate(() => {
      const el = document.getElementById("__NEXT_DATA__");
      return el ? JSON.parse(el.textContent) : null;
    });
  } catch (_) {}

  page.off("response", onResp);

  // raw 저장 (파서가 못 잡으면 이 파일을 보고 보정)
  const rawFile = path.join(RAW_DIR, `${sanitize(kw)}_${TODAY}.json`);
  fs.writeFileSync(rawFile, JSON.stringify({ kw, url, blocked, nextData, captured }, null, 2));

  if (blocked) return { items: [], blocked: true };

  const items = parseItems(nextData, captured, topN);
  return { items, blocked: false };
}

// ============================================================
//  상품 리스트 파싱 (네이버 구조 변동 대비 여러 경로 시도)
// ============================================================
function parseItems(nextData, captured, topN) {
  const candidates = [];

  // 1) 가로챈 내부 API JSON 에서 상품배열 찾기
  for (const c of captured) {
    collectProductArrays(c.json, candidates);
  }
  // 2) __NEXT_DATA__ 에서 상품배열 찾기
  collectProductArrays(nextData, candidates);

  // 가장 그럴듯한 배열 선택: product 필드를 가진 원소가 가장 많은 것
  let best = null, bestScore = 0;
  for (const arr of candidates) {
    const score = arr.filter(isProductLike).length;
    if (score > bestScore) { bestScore = score; best = arr; }
  }
  if (!best) return [];

  const out = [];
  let rank = 0;
  for (const p of best) {
    if (!isProductLike(p)) continue;
    rank++;
    if (rank > topN) break;
    out.push(normalizeProduct(p, rank));
  }
  return out;
}

// 객체 트리를 재귀로 돌며 '상품스러운 원소를 가진 배열'을 모은다
function collectProductArrays(node, out, depth = 0) {
  if (!node || depth > 10) return;
  if (Array.isArray(node)) {
    if (node.length && node.some(isProductLike)) out.push(node);
    for (const v of node) collectProductArrays(v, out, depth + 1);
  } else if (typeof node === "object") {
    for (const k of Object.keys(node)) collectProductArrays(node[k], out, depth + 1);
  }
}

// 상품 1건인지 판정 (id 계열 + 가격 계열 둘 다 있으면 상품)
function isProductLike(x) {
  if (!x || typeof x !== "object") return false;
  const hasId = x.productId || x.id || x.nvMid || x.mallProductId || x.catalogId;
  const hasPrice = x.lowPrice || x.price || x.lprice || x.salePrice || x.dispLowPrice;
  const hasTitle = x.productTitle || x.title || x.productName;
  return !!(hasId && (hasPrice || hasTitle));
}

// 네이버 상품 객체 → 대시보드 스냅샷 포맷으로 정규화
function normalizeProduct(p, rank) {
  const num = (v) => {
    const n = Number(String(v == null ? "" : v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const type = String(p.productType || p.prodType || "");
  const isCatalog = type === "1" || /catalog/i.test(type) || !!p.catalogId || Number(p.productCount) > 1;
  return {
    pid: String(p.productId || p.id || p.nvMid || p.mallProductId || p.catalogId || rank),
    rank: Number(p.rank) || rank,
    title: stripTags(p.productTitle || p.title || p.productName || ""),
    mall: p.mallName || p.mallNm || p.lowMallList?.[0]?.name || p.mallList?.[0]?.name || "",
    price: num(p.lowPrice || p.price || p.lprice || p.salePrice || p.dispLowPrice),
    link: p.crUrl || p.adcrUrl || p.mallProductUrl || p.productUrl || p.link || "",
    image: p.imageUrl || p.image || p.productImageUrl || "",
    catalog: isCatalog,
    ad: !!(p.adcrUrl || p.adId || p.isAd || p.adProduct),
    reviews: num(p.reviewCount || p.reviewTotal),
    ours: false,
  };
}

// ============================================================
//  유틸
// ============================================================
function markOurs(items, kw) {
  const ids = (OURS[kw] || OURS._all || []).map(String);
  for (const it of items) {
    if (ids.includes(it.pid)) it.ours = true;
    if (MY_MALL && it.mall && it.mall.replace(/\s/g, "").includes(MY_MALL.replace(/\s/g, ""))) it.ours = true;
  }
}
function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
function sanitize(s) {
  return String(s).replace(/[^\w가-힣]+/g, "_").slice(0, 40);
}
