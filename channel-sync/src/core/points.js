import { num, toIso } from './normalize.js';
import { TIERS, tierOf } from './tiers.js';

/**
 * 카페24 적립금 내역 정규화 + 집계.
 * 수집기(src/points.js)와 뷰어(points.html)가 같이 쓰므로 node 전용 모듈을 import 하지 않는다.
 */

/** 응답 필드명이 API 버전마다 조금씩 달라서 후보를 차례로 훑는다. */
export const pick = (o, ...keys) => {
  for (const k of keys) if (o?.[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

/** 카페24 는 KST 로컬 문자열을 준다 — UTC 로 바꾼 뒤 자르면 밤 9시 이후 내역이 다음 날로 밀린다. */
const kstDate = (v) => new Date(Date.parse(toIso(v)) + 9 * 3600_000).toISOString().slice(0, 10);

/** 내역 1줄 → 공통 형태. 증가·감소를 따로 들고, 순변동(delta)은 증가 - 감소. */
export function pointLine(r) {
  let inc = num(pick(r, 'available_points_increase', 'points_increase', 'increase_amount'));
  let dec = num(pick(r, 'available_points_decrease', 'points_decrease', 'decrease_amount'));
  // 한 칸짜리 amount 로 오는 경우: type/case 로 부호를 정한다.
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

/**
 * 정규화된 내역 → 현황 스냅샷.
 * 카페24 report 응답(reportRaw)이 있으면 합계 타일은 그 값을, 없으면 내역 합계를 쓴다.
 */
export function summarize(lines, { from, to, reportRaw = null }) {
  const rep = reportRaw?.report ?? reportRaw?.points ?? reportRaw ?? {};
  const sumInc = lines.reduce((s, l) => s + l.increase, 0);
  const sumDec = lines.reduce((s, l) => s + l.decrease, 0);

  const report = {
    increase: num(pick(rep, 'available_points_increase') ?? sumInc),
    decrease: num(pick(rep, 'available_points_decrease') ?? sumDec),
    total: num(pick(rep, 'available_points_total') ?? sumInc - sumDec),
    unavailable: num(pick(rep, 'unavailable_points') ?? lines.reduce((s, l) => s + l.unavailable, 0)),
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
  const lastGroup = new Map();
  for (const l of [...lines].sort((a, b) => a.at.localeCompare(b.at))) {
    if (l.balance !== null) lastBalance.set(l.memberId, l.balance);
    if (l.group) lastGroup.set(l.memberId, l.group);
  }

  // 등급별: 정책에 있는 등급은 내역이 없어도 0 으로 보여 준다(높은 등급부터). 정책에 없는 그룹명은 뒤에 붙인다.
  const tierName = (l) => tierOf(lastGroup.get(l.memberId) ?? l.group)?.name ?? (l.group || '(등급없음)');
  const tierRows = new Map(group(tierName).map((g) => [g.key, g]));
  const members = new Map();
  for (const l of lines) {
    const k = tierName(l);
    if (!members.has(k)) members.set(k, new Set());
    members.get(k).add(l.memberId);
  }
  const byTier = [
    ...[...TIERS].reverse().map((t) => tierRows.get(t.name) ?? { key: t.name, count: 0, increase: 0, decrease: 0, delta: 0 }),
    ...[...tierRows.values()].filter((g) => !tierOf(g.key)),
  ].map((g) => ({ ...g, members: members.get(g.key)?.size ?? 0 }));

  return {
    generatedAt: new Date().toISOString(),
    range: { from, to },
    report,
    lineCount: lines.length,
    memberCount: new Set(lines.map((l) => l.memberId).filter(Boolean)).size,
    byDate: group((l) => l.date || '(날짜없음)').sort((a, b) => a.key.localeCompare(b.key)),
    byTier,
    byReason: group((l) => l.reason || l.kind || '(사유없음)').sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    byMember: group((l) => l.memberId || '(비회원)')
      .map((m) => ({ ...m, group: lastGroup.get(m.key) ?? '', balance: lastBalance.get(m.key) ?? null }))
      .sort((a, b) => b.increase + b.decrease - (a.increase + a.decrease)),
    lines: [...lines].sort((a, b) => b.at.localeCompare(a.at)),
  };
}
