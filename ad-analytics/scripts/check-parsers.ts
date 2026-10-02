import { readFileSync } from "node:fs";
import { autoMapColumns, getParser, normalizeRows, readSpreadsheet } from "@/lib/parsers";
import type { PlatformId } from "@/types/ad-data";

async function main() {
/** 개발용: 샘플 파일 파싱 검증 (npx tsx scripts/check-parsers.ts) */

const cases: [string, PlatformId][] = [
  ["public/samples/meta-sample.csv", "meta"],
  ["public/samples/naver-shopping-sample.csv", "naver_shopping"],
  ["public/samples/naver-powerlink-sample.xlsx", "naver_powerlink"],
];
for (const [path, platform] of cases) {
  const file = new File([readFileSync(path)], path.split("/").pop()!);
  const parser = getParser(platform);
  const table = await readSpreadsheet(file, parser);
  const mapping = autoMapColumns(table.headers, parser);
  const res = normalizeRows(table, mapping, parser, { brand: "몽프루이", sourceFileId: "test" });
  console.log(`\n== ${path} (header row ${table.headerRowIndex + 1})`);
  console.log(Object.entries(mapping).map(([k, v]) => `${k} → ${v ?? "-"}`).join(" | "));
  console.log("records", res.records.length, "skipped", res.skippedRows, "range", res.dateRange, "errors", res.errors.slice(0, 3), "warnings", res.warnings);
  console.log(res.records[0]);
}
// 오류 케이스
try {
  await readSpreadsheet(new File(["x"], "report.pdf"), getParser("meta"));
} catch (e) {
  console.log("\nPDF:", (e as Error).message);
}
try {
  const f = new File(["foo,bar\n1,2\n"], "bad.csv");
  const p = getParser("meta");
  const t = await readSpreadsheet(f, p);
  normalizeRows(t, autoMapColumns(t.headers, p), p, { brand: "x", sourceFileId: "y" });
} catch (e) {
  console.log("BAD:", (e as Error).message);
}
try {
  const f = new File(["Day,Campaign name,Amount spent,Impressions,Link clicks\nabc,A,100,10,1\n어제,B,100,10,1\n"], "baddate.csv");
  const p = getParser("meta");
  const t = await readSpreadsheet(f, p);
  normalizeRows(t, autoMapColumns(t.headers, p), p, { brand: "x", sourceFileId: "y" });
} catch (e) {
  console.log("BADDATE:", (e as Error).message);
}

}

void main();
