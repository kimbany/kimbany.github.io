/**
 * 최근 60일 realistic mock 데이터 생성기.
 * 오늘 기준 상대 날짜로 생성하며, 일부 구간에 의도적인 이상 데이터를 넣어
 * Alert / AI Insight UI 를 테스트할 수 있게 한다.
 *
 * 주입된 이상징후 (t = 오늘로부터 n일 전)
 *  A. Naver Shopping 몽프루이 신고배·사과·샤인머스캣 : t≤2 CVR 50% 급락 → ROAS 급락 (Critical)
 *  B. Naver Powerlink 몽프루이 과일선물세트 등       : t≤3 CPC 60% 급등
 *  C. Meta 몽프루이 Traffic Campaign                : 오늘 광고비 60% 급증, 전환 정체
 *  D. Meta 몽프루이 Conversion Campaign             : t≤6 CVR 35% 개선 → ROAS 개선 (Positive)
 *  E. Meta 귤타민 Engagement Campaign               : t≤4 CTR 45% 급락
 *  F. 반시 2.5kg / '프리미엄 과일'                   : 광고비 발생 + 전환 0
 */
import type { AdRecord, PlatformId } from "@/types/ad-data";
import { SAMPLE_SOURCE_ID } from "@/types/ad-data";
import { addDays, diffDays, toUtcDate } from "@/lib/utils/date";
import { CATALOG } from "./catalog";
import { mulberry32, noise, seedFrom } from "./random";

interface Mods {
  spend: number;
  cpc: number;
  ctr: number;
  cvr: number;
  aov: number;
}

function anomalyMods(brand: string, platform: PlatformId, entity: string, t: number): Mods {
  const m: Mods = { spend: 1, cpc: 1, ctr: 1, cvr: 1, aov: 1 };
  if (brand === "몽프루이") {
    if (platform === "naver_shopping" && ["신고배 3kg", "사과 3kg", "샤인머스캣 2kg"].includes(entity) && t <= 2) m.cvr = 0.5;
    if (platform === "naver_powerlink" && ["과일선물세트", "과일 선물", "추석 과일선물"].includes(entity) && t <= 3) {
      m.cpc = 1.6;
      m.spend = 1.45;
    }
    if (platform === "meta" && entity === "Traffic Campaign" && t === 0) {
      m.spend = 1.6;
      m.cvr = 0.62;
    }
    if (platform === "meta" && entity === "Conversion Campaign" && t <= 6) {
      m.cvr = 1.35;
      m.aov = 1.05;
    }
  }
  if (brand === "귤타민" && platform === "meta" && entity === "Engagement Campaign" && t <= 4) m.ctr = 0.55;
  return m;
}

/** 확률적 반올림: 작은 기대값(0.4건 등)도 기간 합계가 기대값에 수렴하도록 */
function sround(v: number, rand: () => number): number {
  const f = Math.floor(v);
  return f + (rand() < v - f ? 1 : 0);
}

const WEEKDAY_META = [1.08, 0.94, 0.96, 0.98, 1.0, 1.04, 1.1]; // 일~토
const WEEKDAY_SEARCH = [0.9, 1.06, 1.05, 1.03, 1.02, 0.98, 0.88];

export interface MockOptions {
  endDate: string;
  days?: number;
}

export function generateMockRecords({ endDate, days = 60 }: MockOptions): AdRecord[] {
  const out: AdRecord[] = [];
  const start = addDays(endDate, -(days - 1));
  let seq = 0;

  const push = (r: Omit<AdRecord, "id" | "sourceFileId">) => {
    out.push({ ...r, id: `mock_${seq++}`, sourceFileId: SAMPLE_SOURCE_ID });
  };

  for (let date = start; date <= endDate; date = addDays(date, 1)) {
    const t = diffDays(date, endDate);
    const dow = toUtcDate(date).getUTCDay();
    const trend = 1 + (days - 1 - t) * 0.004;

    for (const cat of CATALOG) {
      const brand = cat.brand;

      // ---------- Meta ----------
      for (const c of cat.meta) {
        const mods = anomalyMods(brand, "meta", c.name, t);
        for (const set of c.adSets) {
          set.ads.forEach((ad, ai) => {
            const rand = mulberry32(seedFrom(`${date}|${brand}|${c.name}|${set.name}|${ad}`));
            const adWeight = ai === 0 ? 0.55 : 0.45;
            const spend = Math.round(c.dailySpend * set.weight * adWeight * trend * WEEKDAY_META[dow] * mods.spend * noise(rand, 0.07));
            const impressions = Math.round((spend / (c.cpm * noise(rand, 0.05))) * 1000);
            const clicks = Math.round(impressions * (c.ctr / 100) * mods.ctr * noise(rand, 0.06));
            const conversions = sround(clicks * (c.cvr / 100) * mods.cvr * noise(rand, 0.08), rand);
            const revenue = Math.round((conversions * c.aov * mods.aov * noise(rand, 0.05)) / 100) * 100;
            const frequency = 1.4 + rand() * 0.8;
            push({
              date,
              platform: "meta",
              brand,
              campaign: c.name,
              adGroup: set.name,
              ad,
              product: "",
              keyword: "",
              creative: ad,
              placement: c.objective === "engagement" ? "Instagram Reels" : "Facebook/Instagram Feed",
              spend,
              impressions,
              clicks,
              conversions,
              revenue,
              orders: conversions,
              reach: Math.round(impressions / frequency),
              frequency: Math.round(frequency * 100) / 100,
              landingPageViews: Math.round(clicks * (0.68 + rand() * 0.12)),
              addToCart: Math.round(conversions * (2.8 + rand() * 0.8) + clicks * 0.01),
              videoViews: ad.includes("영상") || ad.includes("릴스") ? Math.round(impressions * (0.18 + rand() * 0.08)) : undefined,
            });
          });
        }
      }

      // ---------- Naver Shopping ----------
      for (const p of cat.products) {
        const mods = anomalyMods(brand, "naver_shopping", p.name, t);
        const rand = mulberry32(seedFrom(`${date}|${brand}|shop|${p.name}`));
        const spend = Math.round(p.dailySpend * trend * WEEKDAY_SEARCH[dow] * mods.spend * noise(rand, 0.08));
        const clicks = Math.round(spend / (p.cpc * mods.cpc * noise(rand, 0.05)));
        const impressions = Math.round(clicks / ((p.ctr / 100) * mods.ctr * noise(rand, 0.06)));
        const conversions = sround(clicks * (p.cvr / 100) * mods.cvr * noise(rand, 0.08), rand);
        const revenue = Math.round((conversions * p.aov * mods.aov * noise(rand, 0.05)) / 100) * 100;
        push({
          date,
          platform: "naver_shopping",
          brand,
          campaign: cat.shoppingCampaign,
          adGroup: p.adGroup,
          ad: p.name,
          product: p.name,
          keyword: "",
          device: "ALL",
          spend,
          impressions,
          clicks,
          conversions,
          revenue,
          orders: conversions,
        });
      }

      // ---------- Naver Powerlink ----------
      for (const k of cat.keywords) {
        const mods = anomalyMods(brand, "naver_powerlink", k.keyword, t);
        const rand = mulberry32(seedFrom(`${date}|${brand}|pl|${k.keyword}`));
        const spend = Math.round(k.dailySpend * trend * WEEKDAY_SEARCH[dow] * mods.spend * noise(rand, 0.08));
        const clicks = Math.round(spend / (k.cpc * mods.cpc * noise(rand, 0.05)));
        const impressions = Math.round(clicks / ((k.ctr / 100) * mods.ctr * noise(rand, 0.06)));
        const conversions = sround(clicks * (k.cvr / 100) * mods.cvr * noise(rand, 0.1), rand);
        const revenue = Math.round((conversions * k.aov * mods.aov * noise(rand, 0.05)) / 100) * 100;
        push({
          date,
          platform: "naver_powerlink",
          brand,
          campaign: k.campaign,
          adGroup: k.adGroup,
          ad: "",
          product: "",
          keyword: k.keyword,
          device: "ALL",
          spend,
          impressions,
          clicks,
          conversions,
          revenue,
          orders: conversions,
        });
      }
    }
  }
  return out;
}
