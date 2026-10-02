/** 업로드 테스트용 샘플 보고서 생성 (npx tsx scripts/make-samples.ts) */
import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { generateMockRecords } from "@/lib/mock/generate";
import { addDays, todayLocal } from "@/lib/utils/date";

const end = addDays(todayLocal(), -1);
const records = generateMockRecords({ endDate: end, days: 14 }).map((r) => ({ ...r, spend: Math.round(r.spend * 0.97) }));
const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((c) => (typeof c === "string" && /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
const comma = (n: number) => Math.round(n).toLocaleString("en-US");

// Meta (영문 컬럼, UTF-8)
const meta = records.filter((r) => r.platform === "meta" && r.brand === "몽프루이");
writeFileSync(
  "public/samples/meta-sample.csv",
  "﻿" +
    csv([
      ["Reporting starts", "Reporting ends", "Day", "Campaign name", "Ad set name", "Ad name", "Amount spent (KRW)", "Impressions", "Reach", "Frequency", "Link clicks", "Landing page views", "Adds to cart", "Purchases", "Purchase conversion value"],
      ...meta.map((r) => [addDays(end, -13), end, r.date, r.campaign, r.adGroup, r.ad, r.spend, r.impressions, r.reach ?? 0, r.frequency ?? 0, r.clicks, r.landingPageViews ?? 0, r.addToCart ?? 0, r.conversions, r.revenue]),
    ]),
);

// Naver Shopping (한글 컬럼, 상단 제목행 + 합계행, EUC-KR 변환은 python 으로)
const shop = records.filter((r) => r.platform === "naver_shopping" && r.brand === "몽프루이");
const dot = (d: string) => d.replace(/-/g, ".") + ".";
writeFileSync(
  "public/samples/naver-shopping-sample.utf8.csv",
  csv([
    ["쇼핑검색광고 소재 보고서"],
    [`기간: ${dot(addDays(end, -13))} ~ ${dot(end)}`],
    ["일별", "캠페인", "광고그룹", "소재명", "노출수", "클릭수", "클릭률(%)", "평균클릭비용(VAT포함,원)", "총비용(VAT포함,원)", "구매완료 전환수", "구매완료 전환매출액(원)"],
    ...shop.map((r) => [dot(r.date), r.campaign, r.adGroup, r.product, comma(r.impressions), comma(r.clicks), ((r.clicks / r.impressions) * 100).toFixed(2) + "%", comma(r.spend / Math.max(1, r.clicks)), comma(r.spend), r.conversions, comma(r.revenue)]),
    ["합계", "", "", "", comma(shop.reduce((s, r) => s + r.impressions, 0)), comma(shop.reduce((s, r) => s + r.clicks, 0)), "", "", comma(shop.reduce((s, r) => s + r.spend, 0)), shop.reduce((s, r) => s + r.conversions, 0), comma(shop.reduce((s, r) => s + r.revenue, 0))],
  ]),
);

// Naver Powerlink (XLSX)
const pl = records.filter((r) => r.platform === "naver_powerlink" && r.brand === "몽프루이");
const ws = XLSX.utils.aoa_to_sheet([
  ["일자", "캠페인명", "광고그룹명", "키워드", "노출수", "클릭수", "총비용(VAT포함,원)", "전환수", "전환매출액(원)"],
  ...pl.map((r) => [r.date, r.campaign, r.adGroup, r.keyword, r.impressions, r.clicks, r.spend, r.conversions, r.revenue]),
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "키워드 보고서");
writeFileSync("public/samples/naver-powerlink-sample.xlsx", XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
console.log("meta", meta.length, "shop", shop.length, "powerlink", pl.length);
