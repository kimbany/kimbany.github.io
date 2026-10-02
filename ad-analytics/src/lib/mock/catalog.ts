/** mock 데이터용 캠페인 / 상품 / 키워드 카탈로그 (현실적인 과일 이커머스 수치) */

export interface MetaCampaignSpec {
  name: string;
  objective: "conversion" | "traffic" | "engagement";
  dailySpend: number;
  cpm: number;
  ctr: number; // %
  cvr: number; // %
  aov: number;
  adSets: { name: string; weight: number; ads: string[] }[];
}

export interface ProductSpec {
  name: string;
  adGroup: string;
  dailySpend: number;
  cpc: number;
  ctr: number;
  cvr: number;
  aov: number;
}

export interface KeywordSpec {
  keyword: string;
  campaign: string;
  adGroup: string;
  dailySpend: number;
  cpc: number;
  ctr: number;
  cvr: number;
  aov: number;
}

export interface BrandCatalog {
  brand: string;
  scale: number;
  meta: MetaCampaignSpec[];
  shoppingCampaign: string;
  products: ProductSpec[];
  keywords: KeywordSpec[];
}

const metaCampaigns = (scale: number, theme: string): MetaCampaignSpec[] => [
  {
    name: "Conversion Campaign",
    objective: "conversion",
    dailySpend: 320_000 * scale,
    cpm: 9_500,
    ctr: 1.45,
    cvr: 4.6,
    aov: 54_000,
    adSets: [
      { name: "리타겟팅_장바구니", weight: 0.45, ads: [`${theme}_리뷰형_영상`, `${theme}_카탈로그`] },
      { name: "유사타겟_구매자1%", weight: 0.55, ads: [`${theme}_선물세트_이미지`, `${theme}_산지직송_영상`] },
    ],
  },
  {
    name: "Traffic Campaign",
    objective: "traffic",
    dailySpend: 110_000 * scale,
    cpm: 5_200,
    ctr: 2.3,
    cvr: 1.3,
    aov: 46_000,
    adSets: [
      { name: "관심사_과일·건강", weight: 0.6, ads: [`${theme}_혜택배너`, `${theme}_후기캐러셀`] },
      { name: "광범위_2545여성", weight: 0.4, ads: [`${theme}_시즌한정`, `${theme}_가격강조`] },
    ],
  },
  {
    name: "Engagement Campaign",
    objective: "engagement",
    dailySpend: 55_000 * scale,
    cpm: 3_600,
    ctr: 0.95,
    cvr: 0.7,
    aov: 41_000,
    adSets: [{ name: "브랜드인지_전체", weight: 1, ads: [`${theme}_브랜드스토리`, `${theme}_릴스_수확`] }],
  },
];

export const CATALOG: BrandCatalog[] = [
  {
    brand: "몽프루이",
    scale: 1,
    meta: metaCampaigns(1, "몽프루이"),
    shoppingCampaign: "쇼핑검색_과일선물",
    products: [
      { name: "신고배 3kg", adGroup: "프리미엄 선물", dailySpend: 85_000, cpc: 520, ctr: 2.1, cvr: 5.2, aov: 62_000 },
      { name: "사과 3kg", adGroup: "프리미엄 선물", dailySpend: 70_000, cpc: 460, ctr: 2.4, cvr: 5.6, aov: 43_000 },
      { name: "골드키위 1.5kg", adGroup: "실속 과일", dailySpend: 42_000, cpc: 410, ctr: 1.6, cvr: 2.4, aov: 33_000 },
      { name: "샤인머스캣 2kg", adGroup: "프리미엄 선물", dailySpend: 64_000, cpc: 580, ctr: 2.0, cvr: 4.4, aov: 49_000 },
      { name: "반시 2.5kg", adGroup: "실속 과일", dailySpend: 26_000, cpc: 380, ctr: 1.3, cvr: 0, aov: 30_000 },
    ],
    keywords: [
      { keyword: "과일선물세트", campaign: "파워링크_일반", adGroup: "선물세트", dailySpend: 68_000, cpc: 980, ctr: 3.1, cvr: 3.4, aov: 68_000 },
      { keyword: "신고배 선물", campaign: "파워링크_일반", adGroup: "배", dailySpend: 34_000, cpc: 720, ctr: 4.2, cvr: 4.8, aov: 62_000 },
      { keyword: "프리미엄 과일", campaign: "파워링크_일반", adGroup: "선물세트", dailySpend: 31_000, cpc: 1_150, ctr: 1.4, cvr: 0, aov: 70_000 },
      { keyword: "과일 선물", campaign: "파워링크_일반", adGroup: "선물세트", dailySpend: 46_000, cpc: 890, ctr: 2.6, cvr: 2.6, aov: 61_000 },
      { keyword: "사과 선물세트", campaign: "파워링크_일반", adGroup: "사과", dailySpend: 28_000, cpc: 640, ctr: 3.8, cvr: 4.1, aov: 45_000 },
      { keyword: "몽프루이", campaign: "파워링크_브랜드", adGroup: "브랜드", dailySpend: 9_000, cpc: 210, ctr: 11.5, cvr: 9.5, aov: 58_000 },
      { keyword: "추석 과일선물", campaign: "파워링크_일반", adGroup: "시즌", dailySpend: 22_000, cpc: 1_320, ctr: 2.0, cvr: 1.1, aov: 72_000 },
    ],
  },
  {
    brand: "귤타민",
    scale: 0.55,
    meta: metaCampaigns(0.55, "귤타민"),
    shoppingCampaign: "쇼핑검색_감귤",
    products: [
      { name: "제주 감귤 5kg", adGroup: "감귤", dailySpend: 48_000, cpc: 340, ctr: 2.6, cvr: 6.1, aov: 27_000 },
      { name: "한라봉 3kg", adGroup: "만감류", dailySpend: 36_000, cpc: 450, ctr: 2.0, cvr: 4.3, aov: 41_000 },
      { name: "천혜향 2kg", adGroup: "만감류", dailySpend: 27_000, cpc: 470, ctr: 1.8, cvr: 3.9, aov: 37_000 },
      { name: "레드향 2kg", adGroup: "만감류", dailySpend: 22_000, cpc: 490, ctr: 1.5, cvr: 2.1, aov: 39_000 },
    ],
    keywords: [
      { keyword: "제주감귤", campaign: "파워링크_일반", adGroup: "감귤", dailySpend: 31_000, cpc: 560, ctr: 3.4, cvr: 4.2, aov: 29_000 },
      { keyword: "한라봉 선물", campaign: "파워링크_일반", adGroup: "만감류", dailySpend: 24_000, cpc: 690, ctr: 2.9, cvr: 3.6, aov: 45_000 },
      { keyword: "귤 선물세트", campaign: "파워링크_일반", adGroup: "감귤", dailySpend: 18_000, cpc: 760, ctr: 2.2, cvr: 1.4, aov: 36_000 },
      { keyword: "천혜향", campaign: "파워링크_일반", adGroup: "만감류", dailySpend: 14_000, cpc: 520, ctr: 3.0, cvr: 3.1, aov: 38_000 },
      { keyword: "귤타민", campaign: "파워링크_브랜드", adGroup: "브랜드", dailySpend: 5_000, cpc: 190, ctr: 12.4, cvr: 10.2, aov: 33_000 },
    ],
  },
];
