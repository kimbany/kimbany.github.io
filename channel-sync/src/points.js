#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { connect, CREDENTIAL_KEYS } from './adapters/cafe24.js';
import { loadEnv, env, credentials, setEnv, firebaseCredentials } from './config.js';
import { createInterface } from 'node:readline/promises';
import { ROOT } from './core/store.js';
import { createHash } from 'node:crypto';
import { kstToday } from './core/normalize.js';
import { pointLine, summarize, pick } from './core/points.js';
import { num } from './core/normalize.js';
import { sharedFirestore } from './core/firestore.js';
import { log } from './core/log.js';

/**
 * 카페24 적립금 현황 수집 — 읽기 전용.
 *
 *   GET points/report  기간 적립금 집계 (지급 · 차감 · 미가용)
 *   GET points         기간 적립금 내역 (회원 · 사유 · 금액 한 줄씩)
 *
 * 앱 권한에 '적립금 읽기(mall.read_mileage)' 가 있어야 한다.
 * 응답 필드명이 API 버전마다 조금씩 달라서 pick() 으로 후보를 훑고, 원본은 data/points/raw 에 남긴다.
 *
 * FIREBASE_PASSWORD 가 있으면 Firestore(monfruit-sales)에도 저장한다 (points.html 이 거기서 읽는다).
 * PC 에서 처음 돌릴 때 비밀번호가 없으면 매출 리포트 비밀번호 4자리를 물어보고 .env 에 넣는다.
 *   cafe24Points/{id}          내역 1줄 = 문서 1개 (같은 내역은 같은 id → 다시 돌려도 중복 안 생김)
 *   cafe24PointReports/{from_to}  그 기간 집계 스냅샷 (카페24 report 합계 포함)
 */

const MEMBER_CAP = 300; // 스냅샷 문서 1MB 제한 — 회원별은 상위만 담고 나머지는 내역에서 다시 계산한다

const DATA = join(ROOT, 'data', 'points');
const PAGE = 100;
const MAX_OFFSET = 8000; // 카페24 목록 API 의 offset 상한
const CHUNK_DAYS = 30;   // 기간이 길면 offset 상한에 걸리기 쉬워 한 달씩 끊는다
const REPORT_DAYS = 90;  // points/report 는 한 번에 90일까지만 받아 준다 (422 "within 90 days")

function parseArgs(argv) {
  const args = { mock: false, saveRaw: true, db: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock') args.mock = true;
    else if (a === '--no-raw') args.saveRaw = false;
    else if (a === '--no-db') args.db = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--')) {
      const [key, inline] = a.slice(2).split('=');
      args[key] = inline ?? argv[++i];
    }
  }
  return args;
}

const HELP = `
channel-sync points — 카페24 적립금 현황 수집 (읽기 전용)

  node src/points.js [옵션]

  --from YYYY-MM-DD     조회 시작일 (기본: 오늘 - POINTS_LOOKBACK_DAYS, 기본 30일)
  --to   YYYY-MM-DD     조회 종료일 (기본: 오늘)
  --member ID           특정 회원만
  --mock                키 없이 가짜 데이터로 점검
  --no-raw              원본 응답 저장 생략
  --no-db               Firestore 저장 생략 (FIREBASE_* 키가 있어도)

결과: data/points/daily/<날짜>.json, data/points/latest.json
      FIREBASE_* 키가 있으면 Firestore cafe24Points · cafe24PointReports 에도 저장
`;

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

function* chunks(from, to, days = CHUNK_DAYS) {
  for (let start = from; start <= to; start = addDays(start, days)) {
    const end = addDays(start, days - 1);
    yield [start, end < to ? end : to];
  }
}

/** report 응답 두 개를 더한다 — 숫자(또는 숫자 문자열) 칸은 합치고, 나머지는 앞의 값을 둔다. */
function mergeReport(a, b) {
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const out = { ...a };
    // shop_no 같은 번호 칸은 더하면 안 된다
    for (const [k, v] of Object.entries(b)) out[k] = !(k in a) ? v : /(_no|_id|_date)$/.test(k) ? a[k] : mergeReport(a[k], v);
    return out;
  }
  const isNum = (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)));
  return isNum(a) && isNum(b) ? Number(a) + Number(b) : a;
}

async function collect(call, { from, to, member }) {
  // 합계는 90일씩 나눠 받아 숫자 칸끼리 더한다.
  let reportRaw = null;
  for (const [start, end] of chunks(from, to, REPORT_DAYS)) {
    const res = await call('points/report', { start_date: start, end_date: end, member_id: member });
    reportRaw = reportRaw ? mergeReport(reportRaw, res) : res;
  }

  const rows = [];
  for (const [start, end] of chunks(from, to)) {
    for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE) {
      const res = await call('points', {
        start_date: start, end_date: end, member_id: member, limit: PAGE, offset,
      });
      const page = res?.points ?? [];
      rows.push(...page);
      if (page.length < PAGE) break;
      if (offset + PAGE > MAX_OFFSET) log.warn(`${start}~${end} 내역이 offset 상한(${MAX_OFFSET})을 넘어 일부 누락 — 기간을 줄여 다시 돌려 주세요`);
    }
  }
  return { reportRaw, rows };
}

/**
 * 카페24 적립금 내역엔 고유 id 가 없어서 내용으로 만든다.
 * 완전히 같은 줄이 여러 번 오면(같은 시각 같은 금액) 순번을 붙여 구분한다 — 순서는 응답 순서 그대로라 재실행해도 같다.
 */
function lineIds(lines) {
  const seen = new Map();
  return lines.map((l) => {
    const base = createHash('sha1')
      .update([l.memberId, l.at, l.orderId, l.kind, l.reason, l.increase, l.decrease].join('|'))
      .digest('hex').slice(0, 20);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  });
}

/**
 * 관리 대상(설정 화면에서 등록한 직원 · 관리 고객)의 주문은 실결제 금액까지 받아 둔다 —
 * '카드와 함께 본인 몫보다 많은 적립금 사용' 을 찾으려면 주문의 실결제가 필요하다.
 */
async function savePaymentsForWatched(db, lines, call) {
  let watch = [];
  try { watch = await db.list('pointWatchMembers'); } catch (err) { log.warn(`관리 대상 목록 읽기 실패: ${err.message.split('\n')[0]}`); return; }
  const ids = new Set(watch.map((w) => w.memberId ?? w.id));
  const orderIds = [...new Set(lines.filter((l) => ids.has(l.memberId) && l.orderId).map((l) => l.orderId))];
  if (!orderIds.length) return;
  const docs = [];
  for (const orderId of orderIds) {
    try {
      const res = await call(`orders/${orderId}`, {});
      const o = res?.order ?? res ?? {};
      const amt = o.actual_order_amount ?? {};
      docs.push({
        collection: 'cafe24OrderPayments',
        id: orderId,
        data: {
          orderId,
          memberId: String(pick(o, 'member_id') ?? lines.find((l) => l.orderId === orderId)?.memberId ?? ''),
          orderedAt: String(pick(o, 'order_date') ?? ''),
          paymentAmount: num(pick(o, 'payment_amount') ?? pick(amt, 'payment_amount')),
          pointsSpent: num(pick(amt, 'points_spent_amount') ?? pick(o, 'points_spent_amount')),
          orderAmount: num(pick(amt, 'order_price_amount') ?? pick(o, 'order_price_amount')),
          paymentMethod: [].concat(pick(o, 'payment_method_name', 'payment_method') ?? []).join(', '),
          raw: JSON.stringify(o).slice(0, 20_000), // 필드명이 다를 때 보고 맞추려고 원본도 남긴다
          syncedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      log.warn(`주문 ${orderId} 결제정보 실패: ${err.message.split('\n')[0]}`);
    }
  }
  if (docs.length) {
    await db.upsert(docs);
    log.ok(`관리 대상 ${ids.size}명 주문 결제정보 ${docs.length}건 저장`);
  }
}

async function saveToFirestore(lines, snapshot, call) {
  const db = await sharedFirestore();
  if (call) await savePaymentsForWatched(db, lines, call);
  const syncedAt = new Date().toISOString();
  const ids = lineIds(lines);
  const docs = lines.map((l, i) => ({
    collection: 'cafe24Points', id: ids[i], data: { ...l, id: ids[i], syncedAt },
  }));
  const { lines: _omit, byMember, ...rest } = snapshot;
  const reportId = `${snapshot.range.from}_${snapshot.range.to}`;
  docs.push({
    collection: 'cafe24PointReports',
    id: reportId,
    data: { ...rest, id: reportId, byMember: byMember.slice(0, MEMBER_CAP), memberTruncated: byMember.length > MEMBER_CAP, syncedAt },
  });
  await db.upsert(docs);
  log.ok(`DB(Firestore) 저장 — 내역 ${lines.length}건 + 집계 1건`);
}

/** PC 에서 처음이면 매출 리포트 비밀번호를 물어 .env 에 넣는다 (깃허브 자동 실행은 비밀값으로 받음). */
async function askFirebasePin() {
  const fb = await firebaseCredentials();
  if (fb.ready || !process.stdin.isTTY || fb.missing.includes('FIREBASE_API_KEY')) return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nDB 에 저장하려면 매출 리포트(sales-report) 로그인 비밀번호 4자리가 필요합니다. (그냥 엔터 = 이번엔 DB 저장 안 함)');
  const pin = (await rl.question('비밀번호 4자리 > ')).trim();
  rl.close();
  if (!/^\d{4}$/.test(pin)) { log.info('DB 저장 없이 진행합니다'); return; }
  await setEnv('FIREBASE_PASSWORD', `mf${pin}`); // sales-report 와 같은 변환
  log.ok('.env 에 저장했습니다 — 다음부터는 묻지 않습니다');
}

function mockData({ from, to }) {
  const reasons = ['구매 적립', '리뷰 작성 적립', '회원가입 축하', '주문 사용', '이벤트 지급', '소멸'];
  const rows = [];
  let seq = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (let i = 0; i < 4; i++, seq++) {
      const tier = ['MonFruit', 'SILVER', 'GOLD', 'DIAMOND', 'VIP'][((seq * 11) % 23) % 5];
      let reason = reasons[(seq * 7) % reasons.length];
      if (tier === 'MonFruit' && reason === '구매 적립') reason = '리뷰 작성 적립'; // MonFruit 은 구매 적립 0%
      const minus = reason === '주문 사용' || reason === '소멸';
      let amount = [500, 1000, 2000, 3000, 5000][(seq * 3) % 5];
      if (reason === '리뷰 작성 적립') {
        const photo = seq % 3 === 0;
        reason = photo ? '사진 리뷰 작성 적립' : '텍스트 리뷰 작성 적립';
        amount = photo ? 1000 : 500;
      }
      rows.push({
        member_id: `member${(seq * 11) % 23}`,
        group_name: tier,
        order_id: reason.includes('구매') || minus ? `${d.replaceAll('-', '')}-${String(seq).padStart(7, '0')}` : '',
        issue_date: `${d} ${String(9 + i * 3).padStart(2, '0')}:10:00`,
        case: minus ? '차감' : '지급',
        reason,
        available_points_increase: minus ? 0 : amount,
        available_points_decrease: minus ? amount : 0,
        available_points_total: 3000 + ((seq * 1700) % 21000),
      });
    }
  }
  // 관리 적립금 화면용 시나리오: 직원 2명 + 관리 고객 1명
  const D = (day, hh = '10') => `${addDays(from, Math.min(day, Math.max(0, (Date.parse(to) - Date.parse(from)) / 86400_000)))} ${hh}:00:00`;
  const S = (member, day, reason, inc, dec, order = '', admin = '') => rows.push({
    member_id: member, group_name: 'MonFruit', issue_date: D(day), reason, order_id: order, admin_id: admin,
    available_points_increase: inc, available_points_decrease: dec ? -dec : 0,
  });
  S('staff01', 0, '리뷰용 적립금 지급', 30000, 0, '', 'monfruit');
  S('staff01', 1, '주문 사용', 0, 30000, 'W-1001');
  S('staff01', 4, '구매 적립', 600, 0, 'W-1001');
  S('staff01', 5, '사진 리뷰 작성 적립금', 1000, 0, 'W-1001');
  S('staff01', 6, '구매 적립', 450, 0, 'P-2001');
  S('staff01', 7, '리뷰 작성 적립금', 500, 0, 'P-2001');
  S('staff01', 9, '적립금 회수', 0, 1000, '', 'monfruit');
  S('staff02', 0, '체험단 적립금', 50000, 0, '', 'monfruit');
  S('staff02', 2, '주문 사용', 0, 20000, 'W-1002');
  S('staff02', 5, '구매 적립', 700, 0, 'W-1002');
  S('staff02', 6, '리뷰 작성 적립금', 500, 0, 'W-1002');
  S('hong123', 3, 'CS 처리 보상', 5000, 0, '', 'monfruit');
  S('hong123', 8, '주문 사용', 0, 3000, 'P-2002');
  const demo = {
    watch: [
      { memberId: 'staff01', name: '김OO 매니저', type: '직원' },
      { memberId: 'staff02', name: '이OO', type: '직원' },
      { memberId: 'hong123', name: '배송 지연 보상 고객', type: '관리 고객' },
    ],
    payments: {
      'W-1001': { paymentAmount: 0, pointsSpent: 30000 },
      'W-1002': { paymentAmount: 15000, pointsSpent: 20000 },
      'P-2001': { paymentAmount: 22500, pointsSpent: 0 },
      'P-2002': { paymentAmount: 12000, pointsSpent: 3000 },
    },
    notes: { 'W-1001': { note: '9월 신상품 리뷰 작업' } },
  };
  return { reportRaw: null, rows, demo };
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(HELP);

  const to = args.to ?? kstToday();
  const from = args.from ?? kstToday(-Number(env('POINTS_LOOKBACK_DAYS', '30')));
  if (from > to) throw new Error(`--from(${from}) 이 --to(${to}) 보다 늦습니다`);

  log.step(`카페24 적립금 ${from} ~ ${to}${args.member ? ` · 회원 ${args.member}` : ''}${args.mock ? '  (mock)' : ''}`);

  if (!args.mock && args.db) await askFirebasePin();

  let raw;
  let cafe24Call = null;
  if (args.mock) {
    raw = mockData({ from, to });
  } else {
    const { missing, ready } = credentials(CREDENTIAL_KEYS);
    if (!ready) throw new Error(`.env 미설정: ${missing.join(', ')}`);
    cafe24Call = await connect();
    raw = await collect(cafe24Call, { from, to, member: args.member });
    if (args.saveRaw) await writeJson(join(DATA, 'raw', `${to}.json`), raw);
  }

  const lines = raw.rows.map(pointLine);
  const snapshot = summarize(lines, { from, to, reportRaw: raw.reportRaw });
  if (args.mock) { snapshot.mock = true; snapshot.managedDemo = raw.demo; }
  await writeJson(join(DATA, 'daily', `${to}.json`), snapshot);
  await writeJson(join(DATA, 'latest.json'), snapshot);

  const r = snapshot.report;
  const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
  log.ok(`지급 ${won(r.increase)} · 차감 ${won(r.decrease)} · 순증 ${won(r.total)}${r.unavailable ? ` · 미가용 ${won(r.unavailable)}` : ''}`);
  log.info(`내역 ${snapshot.lineCount}건 · 회원 ${snapshot.memberCount}명${r.fromReport ? '' : ' (report 응답 없음 — 내역 합계로 계산)'}`);
  log.info('저장: data/points/latest.json');

  const fb = await firebaseCredentials();
  if (!args.db) log.info('Firestore 저장 생략 (--no-db)');
  else if (args.mock) log.info('Firestore 저장 생략 — 가짜 데이터(--mock)는 DB 에 넣지 않습니다');
  else if (!fb.ready) log.warn(`DB 저장 건너뜀 — .env 미설정: ${fb.missing.join(', ')}`);
  else await saveToFirestore(lines, snapshot, cafe24Call);
}

main().catch((err) => {
  log.fail(err.status ? err.message : err.message.startsWith('.env') ? err.message : err.stack);
  const where = String(err.message);
  if (where.includes('signInWithPassword')) log.warn('DB 로그인 실패 — 매출 리포트 비밀번호가 맞는지 확인하세요. .env 의 FIREBASE_PASSWORD 줄을 지우고 다시 실행하면 다시 물어봅니다');
  else if (err.status === 403 && where.includes('firestore')) log.warn('DB 403 — Firebase 보안 규칙에 cafe24Points · cafe24PointReports · cafe24Auth 를 추가해야 합니다 (README 참고)');
  else if (err.status === 403) log.warn('403 — 앱 권한에 "적립금 읽기(mall.read_mileage)" 를 추가하고 재인증(refresh_token 재발급) 하세요');
  process.exitCode = 1;
});
