/** 개발용: mock 데이터로 분석 파이프라인 결과를 콘솔에서 확인 (npx tsx scripts/check-analytics.ts) */
import { generateMockRecords } from "@/lib/mock/generate";
import { detectAnomalies, getComparisonRange, resolveDateRange, summarize, filterByRange, generateInsightContext } from "@/lib/analytics";
import { DEFAULT_SETTINGS } from "@/lib/config/default-settings";
import { analyzeWithRules } from "@/lib/ai/rule-based-analyzer";
import { todayLocal } from "@/lib/utils/date";

const today = todayLocal();
const records = generateMockRecords({ endDate: today });
const preset = (process.argv[2] as "last7") || "last7";
const range = resolveDateRange(preset, today);
const cmp = getComparisonRange(range);
console.log("records", records.length, range, cmp);
const cur = summarize(filterByRange(records, range));
console.log("current", { spend: cur.spend, revenue: cur.revenue, roas: cur.roas?.toFixed(0), conv: cur.conversions, cpc: cur.cpc?.toFixed(0) });
const alerts = detectAnomalies({ records, range, comparisonRange: cmp, thresholds: DEFAULT_SETTINGS.alertThresholds });
console.log("alerts", alerts.length);
for (const a of alerts) console.log(`[${a.severity}] (${a.basis}) ${a.message} ${a.detail ?? ""}`);
const ctx = generateInsightContext({ records, range, comparisonRange: cmp, alerts, settings: DEFAULT_SETTINGS, filters: { brands: [], platforms: [], campaigns: [] } });
const res = analyzeWithRules(ctx);
console.log("\nSUMMARY", res.summary);
for (const i of res.issues) console.log("-", i.severity, i.title, "|", i.possibleCauses[0]);
console.log("ctx bytes", JSON.stringify(ctx).length);
