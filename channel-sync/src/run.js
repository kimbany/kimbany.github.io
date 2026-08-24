#!/usr/bin/env node
import { adapters, byName } from './adapters/index.js';
import { loadEnv, env, credentials } from './config.js';
import { rollup, saveRaw, saveDaily, saveLatest } from './core/store.js';
import { kstToday } from './core/normalize.js';
import { mockCollect } from './mock/index.js';
import { log } from './core/log.js';

function parseArgs(argv) {
  const args = { mock: false, saveRaw: true, channels: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock') args.mock = true;
    else if (a === '--no-raw') args.saveRaw = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--')) {
      const [key, inline] = a.slice(2).split('=');
      const value = inline ?? argv[++i];
      if (key === 'channel' || key === 'channels') args.channels = value.split(',').map((s) => s.trim());
      else args[key] = value;
    }
  }
  return args;
}

const HELP = `
channel-sync — 판매 채널 일일 현황 수집

  node src/run.js [옵션]

  --from YYYY-MM-DD     조회 시작일 (기본: 오늘 - LOOKBACK_DAYS)
  --to   YYYY-MM-DD     조회 종료일 (기본: 오늘)
  --channel a,b         특정 채널만 (${adapters.map((a) => a.channel).join(', ')})
  --mock                키 없이 가짜 데이터로 파이프라인 점검
  --no-raw              원본 응답 저장 생략
  --help                이 도움말

결과: data/daily/<날짜>.json, data/latest.json (뷰어가 읽는 파일)
`;

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(HELP);

  const to = args.to ?? kstToday();
  const from = args.from ?? kstToday(-Number(env('LOOKBACK_DAYS', '1')));

  const requested = args.channels ?? (env('CHANNELS') ? env('CHANNELS').split(',').map((s) => s.trim()) : null);
  const targets = requested
    ? requested.map((name) => byName[name]).filter(Boolean)
    : adapters;

  const unknown = (requested ?? []).filter((n) => !byName[n]);
  if (unknown.length) log.warn(`모르는 채널 무시: ${unknown.join(', ')}`);

  log.step(`수집 구간 ${from} ~ ${to}${args.mock ? '  (mock)' : ''}`);

  const results = [];
  for (const adapter of targets) {
    const { missing, ready } = credentials(adapter.credentialKeys);

    if (!args.mock && !ready) {
      log.warn(`${adapter.label} 건너뜀 — ${adapter.pending ?? `.env 미설정: ${missing.join(', ')}`}`);
      results.push({ channel: adapter.channel, label: adapter.label, ok: false, skipped: true, error: adapter.pending ?? `미설정: ${missing.join(', ')}` });
      continue;
    }

    try {
      const started = Date.now();
      const out = args.mock
        ? mockCollect(adapter.channel, { from, to })
        : await adapter.collect({ from, to });

      if (args.saveRaw && out.raw && !args.mock) {
        await saveRaw(adapter.channel, 'raw', to, out.raw);
      }
      results.push({
        channel: adapter.channel, label: adapter.label, ok: true,
        products: out.products, orders: out.orders,
      });
      log.ok(`${adapter.label} — 상품 ${out.products.length} · 주문라인 ${out.orders.length} (${Date.now() - started}ms)`);
    } catch (err) {
      const reason = err.message.split('\n')[0];
      log.fail(`${adapter.label} — ${reason}`);
      results.push({ channel: adapter.channel, label: adapter.label, ok: false, error: reason });
    }
  }

  const snapshot = rollup(results, { from, to });
  await saveDaily(to, snapshot);
  await saveLatest(snapshot);

  const t = snapshot.total;
  log.step(`합계 — 주문 ${t.orderCount}건 · 수량 ${t.quantity} · 매출 ${t.amount.toLocaleString('ko-KR')}원 (취소 ${t.canceledAmount.toLocaleString('ko-KR')}원)`);
  log.info(`저장: data/daily/${to}.json, data/latest.json`);

  // 하나라도 실패하면 cron 이 알아챌 수 있게 종료코드를 올린다 (전부 미설정인 경우는 제외).
  if (snapshot.channels.some((c) => !c.ok && !results.find((r) => r.channel === c.channel)?.skipped)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log.fail(err.stack ?? err.message);
  process.exitCode = 1;
});
