import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNegative } from './normalize.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'data');

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path;
}

/** 원본 응답은 그대로 남긴다 — 파싱이 틀렸을 때 재수집 없이 다시 돌릴 수 있어야 한다. */
export const saveRaw = (channel, kind, date, payload) =>
  writeJson(join(DATA, 'raw', date, `${channel}.${kind}.json`), payload);

export const saveDaily = (date, snapshot) =>
  writeJson(join(DATA, 'daily', `${date}.json`), snapshot);

export const saveLatest = (snapshot) => writeJson(join(DATA, 'latest.json'), snapshot);

export async function readDaily(date) {
  try { return JSON.parse(await readFile(join(DATA, 'daily', `${date}.json`), 'utf8')); }
  catch { return null; }
}

/**
 * 옵션 단위 주문 라인을 채널별 / 옵션별로 접는다.
 * 취소·반품은 건수와 금액을 따로 세고, 순매출(net)에서 뺀다.
 */
export function rollup(results, { from, to }) {
  const channels = results.map((r) => {
    const lines = r.orders ?? [];
    const positive = lines.filter((l) => !l.negative);
    const negative = lines.filter((l) => l.negative);

    const byOption = new Map();
    for (const l of lines) {
      const key = `${l.productId}|${l.optionId || l.optionName || '__NONE__'}`;
      const cur = byOption.get(key) ?? {
        productId: l.productId, productName: l.productName,
        optionId: l.optionId, optionName: l.optionName, optionCode: l.optionCode,
        quantity: 0, amount: 0, canceledQuantity: 0, canceledAmount: 0,
      };
      if (l.negative) { cur.canceledQuantity += l.quantity; cur.canceledAmount += l.amount; }
      else { cur.quantity += l.quantity; cur.amount += l.amount; }
      byOption.set(key, cur);
    }

    return {
      channel: r.channel,
      label: r.label,
      ok: r.ok,
      error: r.error ?? null,
      products: (r.products ?? []).length,
      optionsTotal: (r.products ?? []).reduce((s, p) => s + p.optionCount, 0),
      orderCount: new Set(positive.map((l) => l.orderId)).size,
      quantity: positive.reduce((s, l) => s + l.quantity, 0),
      amount: positive.reduce((s, l) => s + l.amount, 0),
      canceledCount: new Set(negative.map((l) => l.orderId)).size,
      canceledAmount: negative.reduce((s, l) => s + l.amount, 0),
      options: [...byOption.values()].sort((a, b) => b.amount - a.amount),
    };
  });

  const live = channels.filter((c) => c.ok);
  return {
    generatedAt: new Date().toISOString(),
    range: { from, to },
    total: {
      channels: channels.length,
      collected: live.length,
      failed: channels.length - live.length,
      products: live.reduce((s, c) => s + c.products, 0),
      options: live.reduce((s, c) => s + c.optionsTotal, 0),
      orderCount: live.reduce((s, c) => s + c.orderCount, 0),
      quantity: live.reduce((s, c) => s + c.quantity, 0),
      amount: live.reduce((s, c) => s + c.amount, 0),
      canceledAmount: live.reduce((s, c) => s + c.canceledAmount, 0),
    },
    channels,
  };
}

export { isNegative };
