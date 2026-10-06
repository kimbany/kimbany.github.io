#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { connect, CREDENTIAL_KEYS } from './adapters/cafe24.js';
import { loadEnv, env, credentials } from './config.js';
import { ROOT } from './core/store.js';
import { createHash } from 'node:crypto';
import { kstToday } from './core/normalize.js';
import { pointLine, summarize } from './core/points.js';
import { connectFirestore } from './core/firestore.js';
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
 * FIREBASE_* 키가 채워져 있으면 Firestore 에도 저장한다 (points.html 이 거기서 읽는다).
 *   cafe24Points/{id}          내역 1줄 = 문서 1개 (같은 내역은 같은 id → 다시 돌려도 중복 안 생김)
 *   cafe24PointReports/{from_to}  그 기간 집계 스냅샷 (카페24 report 합계 포함)
 */

const FIREBASE_KEYS = ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_EMAIL', 'FIREBASE_PASSWORD'];
const MEMBER_CAP = 300; // 스냅샷 문서 1MB 제한 — 회원별은 상위만 담고 나머지는 내역에서 다시 계산한다

const DATA = join(ROOT, 'data', 'points');
const PAGE = 100;
const MAX_OFFSET = 8000; // 카페24 목록 API 의 offset 상한
const CHUNK_DAYS = 30;   // 기간이 길면 offset 상한에 걸리기 쉬워 한 달씩 끊는다

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

function* chunks(from, to) {
  for (let start = from; start <= to; start = addDays(start, CHUNK_DAYS)) {
    const end = addDays(start, CHUNK_DAYS - 1);
    yield [start, end < to ? end : to];
  }
}

async function collect(call, { from, to, member }) {
  const reportRaw = await call('points/report', { start_date: from, end_date: to, member_id: member });

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

async function saveToFirestore(lines, snapshot) {
  const { values } = credentials(FIREBASE_KEYS);
  const db = await connectFirestore({
    apiKey: values.FIREBASE_API_KEY,
    projectId: values.FIREBASE_PROJECT_ID,
    email: values.FIREBASE_EMAIL,
    password: values.FIREBASE_PASSWORD,
  });
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
  log.ok(`Firestore 저장 — 내역 ${lines.length}건 + 집계 1건 (${values.FIREBASE_PROJECT_ID})`);
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
      const amount = [500, 1000, 2000, 3000, 5000][(seq * 3) % 5];
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
  return { reportRaw: null, rows };
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(HELP);

  const to = args.to ?? kstToday();
  const from = args.from ?? kstToday(-Number(env('POINTS_LOOKBACK_DAYS', '30')));
  if (from > to) throw new Error(`--from(${from}) 이 --to(${to}) 보다 늦습니다`);

  log.step(`카페24 적립금 ${from} ~ ${to}${args.member ? ` · 회원 ${args.member}` : ''}${args.mock ? '  (mock)' : ''}`);

  let raw;
  if (args.mock) {
    raw = mockData({ from, to });
  } else {
    const { missing, ready } = credentials(CREDENTIAL_KEYS);
    if (!ready) throw new Error(`.env 미설정: ${missing.join(', ')}`);
    raw = await collect(await connect(), { from, to, member: args.member });
    if (args.saveRaw) await writeJson(join(DATA, 'raw', `${to}.json`), raw);
  }

  const lines = raw.rows.map(pointLine);
  const snapshot = summarize(lines, { from, to, reportRaw: raw.reportRaw });
  if (args.mock) snapshot.mock = true;
  await writeJson(join(DATA, 'daily', `${to}.json`), snapshot);
  await writeJson(join(DATA, 'latest.json'), snapshot);

  const r = snapshot.report;
  const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
  log.ok(`지급 ${won(r.increase)} · 차감 ${won(r.decrease)} · 순증 ${won(r.total)}${r.unavailable ? ` · 미가용 ${won(r.unavailable)}` : ''}`);
  log.info(`내역 ${snapshot.lineCount}건 · 회원 ${snapshot.memberCount}명${r.fromReport ? '' : ' (report 응답 없음 — 내역 합계로 계산)'}`);
  log.info('저장: data/points/latest.json');

  const fb = credentials(FIREBASE_KEYS);
  if (!args.db) log.info('Firestore 저장 생략 (--no-db)');
  else if (args.mock) log.info('Firestore 저장 생략 — 가짜 데이터(--mock)는 DB 에 넣지 않습니다');
  else if (!fb.ready) log.warn(`Firestore 저장 건너뜀 — .env 미설정: ${fb.missing.join(', ')}`);
  else await saveToFirestore(lines, snapshot);
}

main().catch((err) => {
  log.fail(err.status ? err.message : err.message.startsWith('.env') ? err.message : err.stack);
  const where = String(err.message);
  if (where.includes('signInWithPassword')) log.warn('Firebase 로그인 실패 — FIREBASE_EMAIL / FIREBASE_PASSWORD 를 확인하세요 (sales-report 비밀번호면 "mf" + 숫자 4자리)');
  else if (err.status === 403 && where.includes('firestore')) log.warn('Firestore 403 — 보안 규칙에서 cafe24Points · cafe24PointReports 쓰기를 허용해야 합니다 (README 참고)');
  else if (err.status === 403) log.warn('403 — 앱 권한에 "적립금 읽기(mall.read_mileage)" 를 추가하고 재인증(refresh_token 재발급) 하세요');
  process.exitCode = 1;
});
