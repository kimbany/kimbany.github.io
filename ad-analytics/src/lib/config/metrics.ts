import type { MetricKey } from "@/types/analytics";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  /** 한국어 조사 포함 주어형: "ROAS가", "CTR이" */
  subject: string;
  /** higher: 클수록 좋음 / lower: 작을수록 좋음 / neutral: 판단 보류 (광고비) */
  polarity: "higher" | "lower" | "neutral";
  description: string;
}

export const METRICS: Record<MetricKey, MetricDefinition> = {
  spend: { key: "spend", label: "광고비", subject: "광고비가", polarity: "neutral", description: "총 광고 지출" },
  revenue: { key: "revenue", label: "광고 매출", subject: "매출이", polarity: "higher", description: "광고 기여 전환 매출" },
  roas: { key: "roas", label: "ROAS", subject: "ROAS가", polarity: "higher", description: "매출 / 광고비 × 100" },
  conversions: { key: "conversions", label: "전환수", subject: "전환수가", polarity: "higher", description: "구매 전환 수" },
  impressions: { key: "impressions", label: "노출수", subject: "노출수가", polarity: "higher", description: "광고 노출 수" },
  clicks: { key: "clicks", label: "클릭수", subject: "클릭수가", polarity: "higher", description: "광고 클릭 수" },
  ctr: { key: "ctr", label: "CTR", subject: "CTR이", polarity: "higher", description: "클릭 / 노출 × 100" },
  cpc: { key: "cpc", label: "CPC", subject: "CPC가", polarity: "lower", description: "광고비 / 클릭" },
  cvr: { key: "cvr", label: "CVR", subject: "CVR이", polarity: "higher", description: "전환 / 클릭 × 100" },
  cpa: { key: "cpa", label: "CPA", subject: "CPA가", polarity: "lower", description: "광고비 / 전환" },
  cpm: { key: "cpm", label: "CPM", subject: "CPM이", polarity: "lower", description: "광고비 / 노출 × 1000" },
  aov: { key: "aov", label: "객단가", subject: "객단가가", polarity: "higher", description: "매출 / 전환" },
};

export const KPI_METRICS: MetricKey[] = ["spend", "revenue", "roas", "conversions", "ctr", "cpc", "cvr", "cpa"];
