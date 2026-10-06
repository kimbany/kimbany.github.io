import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { request } from '../core/http.js';
import { credentials, env } from '../config.js';
import { ROOT } from '../core/store.js';
import { product, orderLine, STATUS, num, toIso } from '../core/normalize.js';
import { sharedFirestore } from '../core/firestore.js';
import { log } from '../core/log.js';

const TOKEN_FILE = join(ROOT, 'data', '.cafe24-token.json');
const TOKEN_DOC = ['cafe24Auth', 'token']; // Firestore 에 두는 공용 토큰 — PC 와 깃허브 자동 실행이 같이 쓴다

/** 카페24 토큰 시각은 타임존 없는 KST 문자열이라 toIso 로 읽는다. */
const at = (v) => (v ? Date.parse(toIso(v)) : 0);
const issued = (t) => at(t?.issued_at) || Date.parse(t?.savedAt ?? '') || 0;

async function loadLocal() {
  try { return JSON.parse(await readFile(TOKEN_FILE, 'utf8')); } catch { return null; }
}

/** 새 토큰을 PC 파일과 (Firebase 가 설정돼 있으면) Firestore 양쪽에 저장한다. */
export async function saveToken(token) {
  const data = { ...token, savedAt: new Date().toISOString() };
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf8');
  const db = await sharedFirestore().catch(() => null);
  if (db) {
    await db.upsert([{ collection: TOKEN_DOC[0], id: TOKEN_DOC[1], data }]);
    return 'file+db';
  }
  return 'file';
}

/**
 * 카페24 refresh_token 은 쓸 때마다 새 값으로 교체되고(이전 값은 무효), 2주 안 쓰면 만료된다.
 * PC 와 깃허브가 번갈아 돌면 한쪽 토큰이 낡으므로, 파일과 Firestore 중 더 최근에 발급된 쪽을 쓰고
 * 갱신하면 양쪽에 다시 저장한다.
 */
export async function accessToken({ mallId, clientId, clientSecret, refreshToken }) {
  const local = await loadLocal();
  let remote = null;
  const db = await sharedFirestore().catch(() => null);
  if (db) {
    try { remote = await db.get(...TOKEN_DOC); } catch (err) { log.warn(`Firestore 토큰 읽기 실패 — PC 파일로 진행: ${err.message.split('\n')[0]}`); }
  }
  const saved = [local, remote].filter((t) => t?.refresh_token).sort((a, b) => issued(b) - issued(a))[0] ?? null;
  if (!saved && !refreshToken) {
    throw new Error('카페24 토큰이 없습니다 — PC 에서 node src/cafe24-auth.js 로 한 번 연결해 주세요');
  }

  if (saved?.access_token && at(saved.expires_at) > Date.now() + 60_000) {
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
  const where = await saveToken(res);
  log.info(`카페24 토큰 갱신 — ${where === 'file+db' ? 'PC 파일 + Firestore' : 'data/.cafe24-token.json'} 저장`);
  return res.access_token;
}

/**
 * 버전은 비워 두면 헤더를 안 보내 앱 기본 버전(개발자센터 설정)을 쓴다.
 * 지정한 버전이 카페24에서 내려가 400 "version you requested is not available" 이 나면
 * 그 실행 동안은 헤더 없이 다시 보낸다 — 오래된 .env 값 때문에 멈추지 않게.
 */
let versionRejected = false;

export const api = async (mallId, token, path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  const version = versionRejected ? '' : env('CAFE24_API_VERSION');
  const send = (v) => request(`https://${mallId}.cafe24api.com/api/v2/admin/${path}${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(v ? { 'X-Cafe24-Api-Version': v } : {}),
    },
    channel: 'cafe24',
    minIntervalMs: 300,
  });
  try {
    return await send(version);
  } catch (err) {
    if (version && err.status === 400 && /version you requested is not available/i.test(String(err.body))) {
      versionRejected = true;
      log.warn(`카페24 API 버전 ${version} 은 더 이상 지원되지 않아 앱 기본 버전으로 다시 요청합니다 (.env 의 CAFE24_API_VERSION 을 비워 두세요)`);
      return send('');
    }
    throw err;
  }
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

// refresh_token 은 .env 가 아니어도 data/.cafe24-token.json 이나 Firestore 에서 찾으므로 필수 키에서 뺀다.
export const CREDENTIAL_KEYS = ['CAFE24_MALL_ID', 'CAFE24_CLIENT_ID', 'CAFE24_CLIENT_SECRET'];

/** .env 키로 토큰을 받아 두고, 경로·파라미터만 넘기면 되는 호출 함수를 돌려준다. */
export async function connect() {
  const { values } = credentials([...CREDENTIAL_KEYS, 'CAFE24_REFRESH_TOKEN']);
  const mallId = values.CAFE24_MALL_ID;
  const token = await accessToken({
    mallId,
    clientId: values.CAFE24_CLIENT_ID,
    clientSecret: values.CAFE24_CLIENT_SECRET,
    refreshToken: values.CAFE24_REFRESH_TOKEN,
  });
  return (path, params) => api(mallId, token, path, params);
}

export default {
  channel: 'cafe24',
  label: '자사몰(카페24)',
  credentialKeys: CREDENTIAL_KEYS,

  async collect({ from, to, maxProducts = 1000 }) {
    const call = await connect();

    // ── 상품: variants 를 embed 해서 옵션까지 한 번에 받는다.
    const listed = [];
    for (let offset = 0; offset < maxProducts; offset += 100) {
      const res = await call('products', { limit: 100, offset, embed: 'variants' });
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
      const res = await call('orders', {
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
