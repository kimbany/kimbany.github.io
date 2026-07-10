/**
 * poller.js — Workers 엔트리 (Cron 폴링 + 수동 조회 엔드포인트)
 *
 * 이번 세션 범위: 쿠팡 CS문의 조회까지만 연결. 정규화 결과를 콘솔/JSON 으로 확인.
 * 다음 세션(1-6): Firestore 저장(중복 방지) + 스마트스토어/11번가 통합.
 */

import { CS문의조회 } from "./coupang.js";

export default {
  // ── 수동 검증용 HTTP 엔드포인트 ──
  //   GET /coupang/cs?pageSize=50&pageNum=1  → 정규화된 미답변 CS문의 반환
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    try {
      if (path === "/coupang/cs" && request.method === "GET") {
        const 결과 = await CS문의조회(env, {
          pageSize: Number(url.searchParams.get("pageSize")) || 50,
          pageNum: Number(url.searchParams.get("pageNum")) || 1,
        });
        return Response.json({
          status: 결과.status,
          count: 결과.inquiries.length,
          inquiries: 결과.inquiries,
        });
      }
      return new Response("Not Found", { status: 404 });
    } catch (e) {
      return Response.json({ error: String((e && e.message) || e) }, { status: 502 });
    }
  },

  // ── Cron(15분): 3사 폴링 → Firestore. 지금은 쿠팡 조회+로그만. ──
  async scheduled(event, env, ctx) {
    try {
      const 결과 = await CS문의조회(env, {});
      console.log(`[쿠팡 CS] 미답변 ${결과.inquiries.length}건 조회`);
      // TODO(1-6): 중복 방지하며 Firestore inquiries 컬렉션에 upsert.
      // TODO(1-6): 스마트스토어·11번가 조회 결과 병합.
    } catch (e) {
      console.error("[쿠팡 CS] 폴링 실패:", (e && e.message) || e);
    }
  },
};
