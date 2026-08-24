/**
 * 채널 상태 수집 프록시 (6단계)
 *
 * 대시보드는 GitHub Pages 위의 정적 페이지라 채널 API 를 직접 부를 수 없다.
 *   - CORS 로 브라우저 직호출이 막힌다
 *   - 시크릿이 소스에 박히면 그대로 공개된다
 *   - 네이버 커머스API 는 호출 IP 를 사전 등록해야 한다
 * 그래서 이 Worker 가 대신 부르고, 대시보드는 Worker 만 호출한다.
 *
 * 시크릿은 코드에 두지 않는다. `wrangler secret put SS_MO_KEY` 처럼 넣고 env 로 읽는다.
 */

const 허용출처 = ['https://invedory.com', 'http://localhost:8080'];

const CORS헤더 = (출처) => ({
  'Access-Control-Allow-Origin': 허용출처.includes(출처) ? 출처 : 허용출처[0],
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-수집키',
});

const JSON응답 = (값, 출처, 상태 = 200) =>
  new Response(JSON.stringify(값), {
    status: 상태,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS헤더(출처) },
  });

export default {
  async fetch(요청, env) {
    const 출처 = 요청.headers.get('Origin') ?? '';
    if (요청.method === 'OPTIONS') return new Response(null, { headers: CORS헤더(출처) });

    const 주소 = new URL(요청.url);

    // 아무나 부르면 채널 쿼터를 태울 수 있으니 공유 키로 막는다
    if (env.수집키 && 요청.headers.get('X-수집키') !== env.수집키) {
      return JSON응답({ 오류: '인증 실패' }, 출처, 401);
    }

    if (주소.pathname === '/상태') {
      const 채널키 = 주소.searchParams.get('채널');
      const 수집기 = 수집기목록[채널키];
      if (!수집기) return JSON응답({ 오류: `지원하지 않는 채널: ${채널키}` }, 출처, 400);
      try {
        return JSON응답({ 채널: 채널키, 수집시각: new Date().toISOString(), 항목: await 수집기(env) }, 출처);
      } catch (err) {
        return JSON응답({ 채널: 채널키, 오류: err.message }, 출처, 502);
      }
    }

    if (주소.pathname === '/채널목록') {
      return JSON응답({ 채널: Object.keys(수집기목록) }, 출처);
    }

    return JSON응답({ 오류: '없는 경로' }, 출처, 404);
  },

  /** wrangler.toml 의 cron 이 여기로 들어온다. 대시보드의 '수집 시각' 설정과 맞춰 둘 것. */
  async scheduled(_이벤트, env, ctx) {
    ctx.waitUntil(전체수집(env));
  },
};

/**
 * 채널별 수집기.
 *
 * 각 함수는 아래 모양의 배열을 돌려준다. 상태 문자열은 채널 원문 그대로 두고,
 * 4상태로 접는 일은 대시보드의 `상태정규화()` 가 맡는다 — 매핑표를 한 곳에만 두기 위해서다.
 *
 *   [ { 채널상품ID: '12345678', 상태원문: '판매중' }, ... ]
 *
 * 아직 아무 채널도 구현하지 않았다. 인증키가 확보된 채널부터 하나씩 채운다.
 * 채널별 사정은 ../CLAUDE.md 의 '6단계 참고' 절에 정리해 두었다.
 */
const 수집기목록 = {
  // ss_mo:  (env) => 스마트스토어수집(env.SS_MO_KEY, env.SS_MO_SECRET),
  // ss_gy:  (env) => 스마트스토어수집(env.SS_GY_KEY, env.SS_GY_SECRET),
  // st11:   (env) => 십일번가수집(env.ST11_KEY),
};

async function 전체수집(env) {
  const 결과 = {};
  for (const [채널키, 수집기] of Object.entries(수집기목록)) {
    try { 결과[채널키] = await 수집기(env); }
    catch (err) { 결과[채널키] = { 오류: err.message }; }
  }
  // TODO: Firestore REST API 로 스냅샷/{오늘} 에 기록.
  //       지금은 대시보드가 /상태 를 직접 호출하는 방식만 상정한다.
  return 결과;
}
