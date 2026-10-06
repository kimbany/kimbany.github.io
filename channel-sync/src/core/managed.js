import { reviewKind } from './points.js';

/**
 * 관리 적립금 — 직원 · 관리 고객의 적립금을 '회사 몫(회수 대상)' 과 '본인 몫' 으로 나눈다.
 * 수집기와 points.html 이 같이 쓰므로 node 전용 모듈을 import 하지 않는다.
 *
 * 몽프루이 운영 규칙 (2026-10, 사장님 확인):
 * - 리뷰용 · 리뷰작업 · 체험단 등으로 관리자가 수기 지급한 적립금 = 회사 지급 → 회수 대상
 * - CS 처리로 수기 지급한 적립금 = 회수하지 않음
 * - 회사 지급 적립금을 쓴 주문 = 업무용 주문 → 그 주문의 구매 적립 · 리뷰 적립도 회수 대상
 *   (자동 판정이고, 주문마다 화면에서 업무용/본인으로 바꾸고 비고를 적을 수 있다)
 * - 직원이 본인 돈으로 산 주문의 구매 · 리뷰 적립 = 직원 본인 몫
 * - 관리자가 직접 차감한 적립금 = 회수 완료
 * - 카드 등 실결제가 있는 주문에서 본인 몫보다 많은 적립금을 썼으면 '확인 필요'
 */
export const MANAGED_RULES = {
  cs: /\bcs\b|씨에스|cs\s*처리|cs건|보상/i,
  grant: /리뷰\s*용|리뷰\s*작업|지뷰\s*작업|체험단|업무|협찬/,
  event: /가입|생일|축하|이벤트|출석|추천/,
  purchase: /구매|주문\s*적립|결제|배송\s*완료|구매\s*확정/,
  cancel: /취소|환불|반품/,
  expire: /소멸|만료/,
};

export const TYPES = ['직원', '관리 고객'];

/**
 * 줄 하나의 종류.
 *  grant(회사 지급) · cs · event(기타 본인 지급) · purchase · review (주문 연결)
 *  use(주문 사용) · refund(사용 취소로 돌려받음) · reversal(적립 취소) · reclaim(관리자 차감=회수) · expire
 */
/** 카페24 는 적립금 쿠폰 지급에도 order_id 칸에 'mileage_coupon_…' 을 넣는다 — 주문이 아니다. */
export const isCoupon = (l) => /^mileage_coupon/i.test(l.orderId ?? '');

export function classify(l, R = MANAGED_RULES) {
  const text = `${l.reason} ${l.kind}`;
  if (isCoupon(l)) return l.increase > 0 ? 'coupon' : 'reclaim';
  if (l.increase > 0) {
    if (l.orderId && R.cancel.test(text)) return 'refund';
    if (R.cs.test(text)) return 'cs';
    if (R.grant.test(text)) return 'grant';
    if (reviewKind(l)) return l.orderId ? 'review' : 'event';
    if (l.orderId && (R.purchase.test(text) || !l.admin)) return 'purchase';
    if (R.event.test(text)) return 'event';
    // 사유를 알 수 없는 관리자 수기 지급은 회수 대상으로 본다 (회수 안 하는 건 CS 뿐)
    return l.admin ? 'grant' : 'event';
  }
  if (l.decrease > 0) {
    if (R.expire.test(text)) return 'expire';
    if (l.orderId && R.cancel.test(text)) return 'reversal';
    if (l.orderId && !l.admin) return 'use';
    return 'reclaim';
  }
  return 'other';
}

export const KIND_LABEL = {
  grant: '회사 지급', cs: 'CS 지급', coupon: '적립금 쿠폰', event: '기타 지급', purchase: '구매 적립', review: '리뷰 적립',
  use: '주문 사용', refund: '사용 취소', reversal: '적립 취소', reclaim: '관리자 차감(회수)', expire: '소멸', other: '기타',
};

/**
 * 회원 한 명의 내역(전체 기간)을 시간순으로 따라가며 회사 몫 / 본인 몫을 나눈다.
 *
 * lines     cafe24Points 정규화 줄 (이 회원 것)
 * payments  { [orderId]: { paymentAmount, pointsSpent } }  — 카페24 주문의 실결제 · 사용 적립금
 * notes     { [orderId]: { override: 'work'|'personal'|null, note } }
 */
export function analyzeMember(lines, { payments = {}, notes = {} } = {}) {
  const sorted = [...lines].sort((a, b) => a.at.localeCompare(b.at));
  const orders = new Map();
  const orderOf = (id, at) => {
    if (!orders.has(id)) {
      orders.set(id, {
        orderId: id, firstAt: at, used: 0, refunded: 0, purchase: 0, review: 0, reversal: 0,
        autoWork: null, work: false, override: notes[id]?.override ?? null, note: notes[id]?.note ?? '',
        payment: payments[id] ?? null, flag: '',
      });
    }
    return orders.get(id);
  };

  // 주문 사용 시점에 회사 몫이 남아 있었는지로 업무용 주문을 자동 판정하려면,
  // 판정 → 버킷 이동을 한 번에 시간순으로 해야 한다.
  // 회사 몫은 아이디별로 따로 들고 있다 — 회수(관리자 차감)를 아이디마다 하기 때문.
  // 본인 몫은 사람 전체로 하나.
  const cById = new Map();
  const per = new Map();
  const stat = (id) => {
    if (!per.has(id)) per.set(id, { memberId: id, grant: 0, workUsed: 0, workEarned: 0, reclaimed: 0, ownEarned: 0, ownGot: 0, lastAt: '', balance: null });
    return per.get(id);
  };
  const company = () => [...cById.values()].reduce((a, b) => a + b, 0);
  const addC = (id, x) => cById.set(id, (cById.get(id) ?? 0) + x);
  /** 회사 몫을 꺼낸다: 그 아이디부터, 모자라면 같은 사람의 다른 아이디(많은 순)에서 */
  const takeC = (id, amt) => {
    let left = amt;
    const order = [id, ...[...cById.keys()].filter((k) => k !== id).sort((a, b) => cById.get(b) - cById.get(a))];
    for (const k of order) {
      const have = Math.max(0, cById.get(k) ?? 0);
      const take = Math.min(have, left);
      if (take) { cById.set(k, cById.get(k) - take); left -= take; }
      if (!left) break;
    }
    return amt - left;
  };
  /** 한 아이디가 음수가 되면(다른 아이디 몫을 이 아이디에서 차감한 경우) 다른 아이디 몫으로 메운다 */
  const settle = (id) => {
    const v = cById.get(id) ?? 0;
    if (v >= 0) return;
    cById.set(id, 0);
    const got = takeC('__none__', -v);
    if (got < -v) cById.set(id, -(-v - got)); // 다 못 메우면 음수로 남겨 둔다 (회사 몫보다 많이 회수)
  };

  let own = 0;
  const t = { grant: 0, cs: 0, event: 0, workEarned: 0, ownEarned: 0, workUsed: 0, ownUsed: 0, reclaimed: 0, expired: 0 };
  const timeline = [];

  const isWork = (o) => (o.override ? o.override === 'work' : !!o.autoWork);

  for (const l of sorted) {
    const kind = classify(l);
    const id = l.memberId;
    const st = stat(id);
    st.lastAt = l.at;
    if (l.balance !== null) st.balance = l.balance;
    const o = l.orderId && !isCoupon(l) ? orderOf(l.orderId, l.at) : null;
    let bucket = '';
    let flag = '';
    switch (kind) {
      case 'grant': addC(id, l.increase); t.grant += l.increase; st.grant += l.increase; bucket = 'company'; break;
      case 'cs': own += l.increase; t.cs += l.increase; st.ownGot += l.increase; bucket = 'own'; break;
      case 'event':
      case 'coupon': own += l.increase; t.event += l.increase; st.ownGot += l.increase; bucket = 'own'; break; // 적립금 쿠폰 = 기타 지급(본인 몫)
      case 'purchase':
      case 'review': {
        if (o.autoWork === null) o.autoWork = false; // 적립만 있고 사용이 없던 주문 = 본인 주문
        o[kind] += l.increase;
        if (isWork(o)) { addC(id, l.increase); t.workEarned += l.increase; st.workEarned += l.increase; bucket = 'company'; }
        else { own += l.increase; t.ownEarned += l.increase; st.ownEarned += l.increase; bucket = 'own'; }
        break;
      }
      case 'use': {
        const amt = l.decrease;
        if (o.autoWork === null) o.autoWork = company() > 0;
        o.used += amt;
        const paid = o.payment?.paymentAmount ?? null;
        if (paid > 0 && amt > own) {
          flag = `카드 등 실결제 ${paid.toLocaleString('ko-KR')}원과 함께 본인 몫(${Math.round(own).toLocaleString('ko-KR')}원)보다 많은 적립금 사용`;
          o.flag = flag;
        }
        if (isWork(o)) {
          const fromCompany = takeC(id, amt);
          own -= amt - fromCompany;
          t.workUsed += amt; st.workUsed += amt; bucket = 'company';
        } else {
          const fromOwn = Math.min(Math.max(own, 0), amt);
          own -= fromOwn;
          const fromCompany = takeC(id, amt - fromOwn);
          own -= amt - fromOwn - fromCompany;
          t.ownUsed += amt; bucket = 'own';
        }
        break;
      }
      case 'refund':
        o.refunded += l.increase;
        if (isWork(o)) { addC(id, l.increase); t.workUsed -= l.increase; st.workUsed -= l.increase; bucket = 'company'; }
        else { own += l.increase; t.ownUsed -= l.increase; bucket = 'own'; }
        break;
      case 'reversal':
        o.reversal += l.decrease;
        if (isWork(o)) { addC(id, -l.decrease); settle(id); t.workEarned -= l.decrease; st.workEarned -= l.decrease; bucket = 'company'; }
        else { own -= l.decrease; t.ownEarned -= l.decrease; st.ownEarned -= l.decrease; bucket = 'own'; }
        break;
      case 'reclaim':
        addC(id, -l.decrease); settle(id);
        t.reclaimed += l.decrease; st.reclaimed += l.decrease; bucket = 'company';
        break;
      case 'expire': {
        // 소멸은 그 아이디의 회사 몫에서 먼저 뺀다 (업무용으로 받아 두고 안 쓴 적립금이 보통 먼저 소멸)
        const fromCompany = Math.min(Math.max(cById.get(id) ?? 0, 0), l.decrease);
        addC(id, -fromCompany); own -= l.decrease - fromCompany;
        t.expired += l.decrease; bucket = fromCompany ? 'company' : 'own';
        break;
      }
      default: break;
    }
    timeline.push({ ...l, type: kind, bucket, flag, companyAfter: company(), ownAfter: own });
  }

  // 아이디별 회수 안내: 그 아이디에 남은 회사 몫만큼, 단 그 아이디 잔액을 넘지 않게.
  // 잔액이 모자라 다 못 빼면 같은 사람의 다른 아이디 중 잔액이 남는 곳에서 뺀다.
  const toReclaim = Math.max(0, Math.round(company()));
  const ids = [...per.values()].map((p) => ({ ...p, company: Math.max(0, Math.round(cById.get(p.memberId) ?? 0)) }));
  for (const p of ids) p.suggest = Math.min(p.company, p.balance ?? p.company);
  let rest = toReclaim - ids.reduce((s2, p) => s2 + p.suggest, 0);
  for (const p of [...ids].sort((a, b) => (b.balance ?? 0) - b.suggest - ((a.balance ?? 0) - a.suggest))) {
    if (rest <= 0) break;
    const room = Math.max(0, (p.balance ?? 0) - p.suggest);
    const add = Math.min(room, rest);
    p.suggest += add; rest -= add;
  }

  for (const o of orders.values()) o.work = isWork(o);
  // 잔액: 아이디가 여러 개면 아이디마다 마지막 잔액을 더한다
  const lastByMember = new Map();
  for (const l of sorted) if (l.balance !== null) lastByMember.set(l.memberId, l.balance);
  const lastBalance = lastByMember.size ? [...lastByMember.values()].reduce((a, b) => a + b, 0) : null;
  const orderList = [...orders.values()].sort((a, b) => b.firstAt.localeCompare(a.firstAt));
  for (const o of orderList) o.memberId = sorted.find((l) => l.orderId === o.orderId)?.memberId ?? '';

  return {
    toReclaim,
    own: Math.round(own),
    balance: lastBalance ?? Math.round(company() + own),
    ids,
    shortfall: Math.max(0, Math.round(rest)), // 잔액이 모자라 아이디에서 다 뺄 수 없는 금액
    totals: t,
    orders: orderList,
    flags: orderList.filter((o) => o.flag).length,
    lastAt: sorted.at(-1)?.at ?? '',
    timeline: timeline.reverse(),
  };
}

/**
 * 관리 대상 = 회원코드(사람) 하나에 카페24 아이디 여러 개.
 * 같은 사람의 아이디들은 한 줄로 합쳐서 시간순으로 따라간다
 * (A 아이디로 받은 회사 지급을 B 아이디 주문에 써도 같은 사람으로 계산되도록).
 *
 * people  [{ code, name, type, memberIds: [...] }]
 */
export function analyzeAll(people, lines, opts = {}) {
  const codeOf = new Map();
  for (const p of people) for (const id of p.memberIds ?? []) codeOf.set(id, p.code);
  const byCode = new Map(people.map((p) => [p.code, []]));
  for (const l of lines) {
    const code = codeOf.get(l.memberId);
    if (code !== undefined) byCode.get(code).push(l);
  }
  const members = people.map((p) => ({ ...p, ...analyzeMember(byCode.get(p.code) ?? [], opts) }));
  return {
    members: members.sort((a, b) => b.flags - a.flags || b.toReclaim - a.toReclaim || String(a.code).localeCompare(String(b.code))),
    total: {
      count: members.length,
      ids: members.reduce((s, m) => s + (m.memberIds?.length ?? 0), 0),
      toReclaim: members.reduce((s, m) => s + m.toReclaim, 0),
      own: members.reduce((s, m) => s + Math.max(0, m.own), 0),
      reclaimed: members.reduce((s, m) => s + m.totals.reclaimed, 0),
      flags: members.reduce((s, m) => s + m.flags, 0),
    },
  };
}

/** 예전 방식(아이디 하나 = 관리 대상 하나)으로 저장된 목록을 회원코드 방식으로 바꾼다. */
export function peopleFromLegacy(legacy) {
  return legacy.map((w) => ({ code: w.memberId, name: w.name ?? '', type: w.type ?? '', memberIds: [w.memberId], createdAt: w.createdAt ?? '' }));
}
