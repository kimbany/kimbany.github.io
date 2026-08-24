import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { request } from '../core/http.js';
import { credentials, env } from '../config.js';
import { ROOT } from '../core/store.js';
import { product, orderLine, STATUS, num } from '../core/normalize.js';
import { log } from '../core/log.js';

const TOKEN_FILE = join(ROOT, 'data', '.cafe24-token.json');

/**
 * 카페24 refresh_token 은 쓸 때마다 새 값으로 교체되고 2주 뒤 만료된다.
 * 매일 도는 수집기라면 갱신된 토큰을 반드시 저장해 둬야 다음 실행이 살아남는다.
 */
async function accessToken({ mallId, clientId, clientSecret, refreshToken }) {
  let saved = null;
  try { saved = JSON.parse(await readFile(TOKEN_FILE, 'utf8')); } catch { /* 최초 실행 */ }

  if (saved?.access_token && saved.expires_at && new Date(saved.expires_at) > new Date(Date.now() + 60_000)) {
    return saved.access_token;
  }

  const res = await request(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: saved?.refresh_token || refreshToken,
    }),
    channel: 'cafe24',
  });

  if (!res?.access_token) throw new Error(`토큰 갱신 실패: ${JSON.stringify(res)}`);
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(res, null, 2), 'utf8');
  log.info('카페24 토큰 갱신 — data/.cafe24-token.json 저장');
  return res.access_token;
}

const api = (mallId, token, path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return request(`https://${mallId}.cafe24api.com/api/v2/admin/${path}${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Cafe24-Api-Version': env('CAFE24_API_VERSION', '2024-06-01'),
    },
    channel: 'cafe24',
    minIntervalMs: 300,
  });
};

/** 카페24 주문상태는 접두 1글자가 대분류다. N=정상, C=취소, R=반품, E=교환. */
function foldStatus(code = '') {
  const head = String(code).charAt(0).toUpperCase();
  if (head === 'C') return STATUS.CANCELED;
  if (head === 'R' || head === 'E') return STATUS.RETURNED;
  if (code === 'N40') return STATUS.DONE;
  if (code === 'N30') return STATUS.SHIPPING;
  return STATUS.ORDERED;
}

export default {
  channel: 'cafe24',
  label: '자사몰(카페24)',
  credentialKeys: ['CAFE24_MALL_ID', 'CAFE24_CLIENT_ID', 'CAFE24_CLIENT_SECRET', 'CAFE24_REFRESH_TOKEN'],

  async collect({ from, to, maxProducts = 1000 }) {
    const { values } = credentials(this.credentialKeys);
    const mallId = values.CAFE24_MALL_ID;
    const token = await accessToken({
      mallId,
      clientId: values.CAFE24_CLIENT_ID,
      clientSecret: values.CAFE24_CLIENT_SECRET,
      refreshToken: values.CAFE24_REFRESH_TOKEN,
    });

    // ── 상품: variants 를 embed 해서 옵션까지 한 번에 받는다.
    const listed = [];
    for (let offset = 0; offset < maxProducts; offset += 100) {
      const res = await api(mallId, token, 'products', { limit: 100, offset, embed: 'variants' });
      const page = res?.products ?? [];
      listed.push(...page);
      if (page.length < 100) break;
    }

    const products = listed.map((p) => product({
      channel: 'cafe24',
      productId: p.product_no,
      name: p.product_name,
      sellerProductCode: p.custom_product_code || p.product_code || '',
      status: p.selling === 'T' ? '판매중' : '판매안함',
      options: (p.variants ?? []).map((v) => ({
        optionId: v.variant_code,
        optionName: (v.options ?? []).map((o) => `${o.name}: ${o.value}`).join(' / ') || '(단일)',
        optionCode: v.custom_variant_code || '',
        price: num(p.price) + num(v.additional_amount),
        stock: v.quantity ?? null,
        status: v.selling === 'T' ? '' : 'DISABLED',
      })),
    }));

    // ── 주문: items 를 embed 하면 옵션 줄까지 같이 온다.
    const orders = [];
    const rawOrders = [];
    for (let offset = 0; offset < 10_000; offset += 100) {
      const res = await api(mallId, token, 'orders', {
        start_date: from, end_date: to, limit: 100, offset, embed: 'items',
      });
      const page = res?.orders ?? [];
      rawOrders.push(...page);
      for (const o of page) {
        for (const it of o.items ?? []) {
          orders.push(orderLine({
            channel: 'cafe24',
            orderId: o.order_id,
            lineId: it.order_item_code,
            orderedAt: o.order_date,
            productId: it.product_no,
            productName: it.product_name,
            optionId: it.variant_code || it.option_id || it.product_no,
            optionName: it.option_value || '(단일)',
            optionCode: it.custom_variant_code || it.product_code || '',
            quantity: num(it.quantity),
            amount: (num(it.product_price) + num(it.option_price)) * num(it.quantity),
            status: foldStatus(it.order_status),
          }));
        }
      }
      if (page.length < 100) break;
    }

    return { products, orders, raw: { products: listed, orders: rawOrders } };
  },
};
