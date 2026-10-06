#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { connect, CREDENTIAL_KEYS } from './adapters/cafe24.js';
import { loadEnv, env, credentials } from './config.js';
import { ROOT } from './core/store.js';
import { num, toIso, kstToday } from './core/normalize.js';
import { log } from './core/log.js';

/**
 * 카페24 적립금 현황 수집 — 읽기 전용.
 *
 *   GET points/report  기간 적립금 집계 (지급 · 차감 · 미가용)
 *   GET points         기간 적립금 내역 (회원 · 사유 · 금액 한 줄씩)
 *
 * 앱 권한에 '적립금 읽기(mall.read_mileage)' 가 있어야 한다.
 * 응답 필드명이 API 버전마다 조금씩 달라서 pick() 으로 후보를 훑고, 원본은 data/points/raw 에 남긴다.
 */

const DATA = join(ROOT, 'data', 'points');
const PAGE = 100;
const MAX_OFFSET = 8000; // 카페24 목록 API 의 offset 상한
const CHUNK_DAYS = 30;   // 기간이 길면 offset 상한에 걸리기 쉬워 한 달씩 끊는다

const pick = (o, ...keys) => {
  for (const k of keys) if (o?.[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

function parseArgs(argv) {
  const args = { mock: false, saveRaw: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock') args.mock = true;
    else if (a === '--no-raw') args.saveRaw = false;
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

결과: data/points/daily/<날짜>.json, data/points/latest.json (points.html 이 읽는 파일)
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

/** 카페24 는 KST 로컬 문자열을 준다 — UTC 로 바꾼 뒤 자르면 밤 9시 이후 내역이 다음 날로 밀린다. */
const kstDate = (v) => new Date(Date.parse(toIso(v)) + 9 * 3600_000).toISOString().slice(0, 10);

/** 내역 1줄 → 공통 형태. 증가·감소를 따로 들고, 순변동(delta)은 증가 - 감소. */
function pointLine(r) {
  const increase = num(pick(r, 'available_points_increase', 'points_increase', 'increase_amount'));
  const decrease = num(pick(r, 'available_points_decrease', 'points_decrease', 'decrease_amount'));
  // 한 칸짜리 amount 로 오는 경우: type/case 로 부호를 정한다.
  let inc = increase;
  let dec = decrease;
  if (!inc && !dec) {
    const amount = num(pick(r, 'amount', 'points'));
    const kind = String(pick(r, 'type', 'case') ?? '').toLowerCase();
    if (kind.includes('decrease') || kind.includes('차감') || kind.includes('사용') || amount < 0) dec = Math.abs(amount);
    else inc = amount;
  }
  const at = pick(r, 'issue_date', 'order_date', 'created_date', 'date');
  return {
    memberId: String(pick(r, 'member_id') ?? ''),
    group: String(pick(r, 'group_name') ?? ''),
    orderId: String(pick(r, 'order_id') ?? ''),
    at: at ? toIso(at) : '',
    date: at ? kstDate(at) : '',
    kind: String(pick(r, 'case', 'type', 'points_type') ?? ''),
    reason: String(pick(r, 'reason', 'memo') ?? '').trim(),
    increase: inc,
    decrease: dec,
    delta: inc - dec,
    balance: pick(r, 'available_points_total') === undefined ? null : num(r.available_points_total),
    unavailable: num(pick(r, 'unavailable_points')),
    admin: String(pick(r, 'admin_name', 'admin_id') ?? ''),
  };
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

/** 집계: 카페24 report 값이 있으면 그걸 기준으로, 없으면 내역 합계로 채운다. */
function summarize({ reportRaw, rows }, { from, to }) {
  const lines = rows.map(pointLine);
  const rep = reportRaw?.report ?? reportRaw?.points ?? reportRaw ?? {};
  const sumInc = lines.reduce((s, l) => s + l.increase, 0);
  const sumDec = lines.reduce((s, l) => s + l.decrease, 0);

  const report = {
    increase: num(pick(rep, 'available_points_increase') ?? sumInc),
    decrease: num(pick(rep, 'available_points_decrease') ?? sumDec),
    total: num(pick(rep, 'available_points_total') ?? sumInc - sumDec),
    unavailable: num(pick(rep, 'unavailable_points')),
    unavailableCoupon: num(pick(rep, 'unavailable_coupon_points')),
    fromReport: pick(rep, 'available_points_increase', 'available_points_total') !== undefined,
  };

  const group = (keyOf) => {
    const map = new Map();
    for (const l of lines) {
      const key = keyOf(l);
      const cur = map.get(key) ?? { key, count: 0, increase: 0, decrease: 0, delta: 0 };
      cur.count++; cur.increase += l.increase; cur.decrease += l.decrease; cur.delta += l.delta;
      map.set(key, cur);
    }
    return [...map.values()];
  };

  const lastBalance = new Map();
  for (const l of [...lines].sort((a, b) => a.at.localeCompare(b.at))) {
    if (l.balance !== null) lastBalance.set(l.memberId, l.balance);
  }

  return {
    generatedAt: new Date().toISOString(),
    range: { from, to },
    report,
    lineCount: lines.length,
    memberCount: new Set(lines.map((l) => l.memberId).filter(Boolean)).size,
    byDate: group((l) => l.date || '(날짜없음)').sort((a, b) => a.key.localeCompare(b.key)),
    byReason: group((l) => l.reason || l.kind || '(사유없음)').sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    byMember: group((l) => l.memberId || '(비회원)')
      .map((m) => ({ ...m, balance: lastBalance.get(m.key) ?? null }))
      .sort((a, b) => b.increase + b.decrease - (a.increase + a.decrease)),
    lines: lines.sort((a, b) => b.at.localeCompare(a.at)),
  };
}

function mockData({ from, to }) {
  const reasons = ['구매 적립', '리뷰 작성 적립', '회원가입 축하', '주문 사용', '이벤트 지급', '소멸'];
  const rows = [];
  let seq = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (let i = 0; i < 4; i++, seq++) {
      const reason = reasons[(seq * 7) % reasons.length];
      const minus = reason === '주문 사용' || reason === '소멸';
      const amount = [500, 1000, 2000, 3000, 5000][(seq * 3) % 5];
      rows.push({
        member_id: `member${(seq * 11) % 23}`,
        group_name: seq % 3 ? '일반회원' : 'VIP',
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

  const snapshot = summarize(raw, { from, to });
  if (args.mock) snapshot.mock = true;
  await writeJson(join(DATA, 'daily', `${to}.json`), snapshot);
  await writeJson(join(DATA, 'latest.json'), snapshot);

  const r = snapshot.report;
  const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
  log.ok(`지급 ${won(r.increase)} · 차감 ${won(r.decrease)} · 순증 ${won(r.total)}${r.unavailable ? ` · 미가용 ${won(r.unavailable)}` : ''}`);
  log.info(`내역 ${snapshot.lineCount}건 · 회원 ${snapshot.memberCount}명${r.fromReport ? '' : ' (report 응답 없음 — 내역 합계로 계산)'}`);
  log.info('저장: data/points/latest.json');
}

main().catch((err) => {
  log.fail(err.status ? err.message : err.message.startsWith('.env') ? err.message : err.stack);
  if (err.status === 403) log.warn('403 — 앱 권한에 "적립금 읽기(mall.read_mileage)" 를 추가하고 재인증(refresh_token 재발급) 하세요');
  process.exitCode = 1;
});
