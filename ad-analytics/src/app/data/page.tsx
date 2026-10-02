"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileWarning, RotateCcw } from "lucide-react";
import type { PlatformId } from "@/types/ad-data";
import type { ColumnMapping, DuplicateMode, ParseResult, RawTable, UploadRecord } from "@/types/upload";
import { autoMapColumns, getParser, normalizeRows, ParseError, readSpreadsheet, validateMapping, FIELD_LABELS } from "@/lib/parsers";
import { createId } from "@/lib/utils/id";
import { formatNumber } from "@/lib/utils/format";
import { useDataStore } from "@/store/data-store";
import { useSettingsStore } from "@/store/settings-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/data-upload/file-uploader";
import { FilePreview } from "@/components/data-upload/file-preview";
import { ColumnMapper } from "@/components/data-upload/column-mapper";
import { DuplicateDialog } from "@/components/data-upload/duplicate-dialog";
import { UploadHistoryTable } from "@/components/data-upload/upload-history-table";

interface Draft {
  file: File;
  table: RawTable;
  mapping: ColumnMapping;
  uploadId: string;
}

const SAMPLE_FILES = [
  { href: "/samples/meta-sample.csv", label: "Meta 샘플 (CSV)" },
  { href: "/samples/naver-shopping-sample.csv", label: "네이버 쇼핑검색 샘플 (CSV · EUC-KR)" },
  { href: "/samples/naver-powerlink-sample.xlsx", label: "네이버 파워링크 샘플 (XLSX)" },
];

export default function DataPage() {
  const brandList = useSettingsStore((s) => s.settings.brands);
  const settings = useSettingsStore((s) => s.settings);
  const saveSettings = useSettingsStore((s) => s.save);
  const brands = useMemo(() => brandList.map((b) => b.name), [brandList]);
  const uploads = useDataStore((s) => s.uploads);
  const importUpload = useDataStore((s) => s.importUpload);
  const findDuplicates = useDataStore((s) => s.findDuplicates);
  const deleteUpload = useDataStore((s) => s.deleteUpload);

  const [platform, setPlatform] = useState<PlatformId>("meta");
  const [brand, setBrand] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [dup, setDup] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const brandValue = brand || brands[0] || "";
  const parser = getParser(platform);
  const validation = useMemo(() => (draft ? validateMapping(draft.mapping, parser) : null), [draft, parser]);

  const reset = () => {
    setDraft(null);
    setResult(null);
    setError(null);
    setDup(null);
  };

  const load = async (file: File, p: PlatformId) => {
    setLoading(true);
    setError(null);
    setDone(null);
    setResult(null);
    try {
      const prs = getParser(p);
      const table = await readSpreadsheet(file, prs);
      setDraft({ file, table, mapping: autoMapColumns(table.headers, prs), uploadId: createId("upl") });
    } catch (e) {
      setDraft(null);
      setError(e instanceof ParseError ? e.message : `파일을 처리하는 중 오류가 발생했습니다: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const convert = () => {
    if (!draft) return;
    setError(null);
    try {
      setResult(normalizeRows(draft.table, draft.mapping, parser, { brand: brandValue, sourceFileId: draft.uploadId }));
    } catch (e) {
      setResult(null);
      setError(e instanceof ParseError ? e.message : `변환 중 오류가 발생했습니다: ${(e as Error).message}`);
    }
  };

  const save = async (mode: DuplicateMode) => {
    if (!draft || !result) return;
    const upload: UploadRecord = {
      id: draft.uploadId,
      uploadedAt: new Date().toISOString(),
      fileName: draft.file.name,
      platform,
      brand: brandValue,
      dataStartDate: result.dateRange?.start ?? null,
      dataEndDate: result.dateRange?.end ?? null,
      rowCount: result.records.length,
      skippedRows: result.skippedRows,
      status: result.skippedRows > 0 || result.errors.length > 0 ? "partial" : "success",
    };
    try {
      const r = await importUpload({ records: result.records, upload, mode });
      setDone(`${formatNumber(r.inserted)}행을 등록했습니다.${r.skipped ? ` 중복 ${formatNumber(r.skipped)}행은 제외했습니다.` : ""}${r.replaced ? ` 중복 ${formatNumber(r.replaced)}행을 덮어썼습니다.` : ""}`);
      reset();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const register = () => {
    if (!result) return;
    const dups = findDuplicates(result.records);
    if (dups.size) setDup(dups.size);
    else void save("skip");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>광고 보고서 업로드</CardTitle>
              <CardDescription>CSV · XLS · XLSX → 미리보기 → 컬럼 Mapping 확인 → 공통 형식으로 변환 → 중복 검사 후 등록</CardDescription>
            </div>
            {draft && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw /> 다시 선택
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploader
              platform={platform}
              brand={brandValue}
              brands={brands}
              loading={loading}
              onPlatformChange={(p) => {
                setPlatform(p);
                if (draft) void load(draft.file, p);
              }}
              onBrandChange={(b) => {
                setBrand(b);
                setResult(null);
              }}
              onFile={(f) => void load(f, platform)}
            />
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3 py-2.5 text-sm text-negative">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </div>
            )}
            {done && (
              <div className="flex items-start gap-2 rounded-lg border border-positive/30 bg-positive-soft px-3 py-2.5 text-sm text-positive">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1">
                  {done} Dashboard 에서 바로 확인할 수 있습니다.
                  {settings.useSampleData && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-foreground">
                      현재 샘플 데이터가 함께 집계되고 있습니다.
                      <Button size="sm" variant="outline" className="h-7" onClick={() => void saveSettings({ ...settings, useSampleData: false })}>
                        샘플 데이터 끄기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <div>
              <CardTitle>샘플 파일</CardTitle>
              <CardDescription>업로드 기능 테스트용 예시 보고서</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {SAMPLE_FILES.map((s) => (
              <a key={s.href} href={s.href} download className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <Download className="size-4 text-muted-foreground" /> {s.label}
              </a>
            ))}
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              업로드된 데이터는 이 브라우저(localStorage)에만 저장되며 외부 서버로 전송되지 않습니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {draft && (
        <>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>컬럼 Mapping</CardTitle>
                <CardDescription>
                  시스템이 자동 인식한 결과입니다. 잘못된 항목은 직접 수정하세요. (시트 &quot;{draft.table.sheetName}&quot; · 헤더 {draft.table.headerRowIndex + 1}행 · 데이터 {formatNumber(draft.table.rows.length)}행)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColumnMapper
                table={draft.table}
                parser={parser}
                mapping={draft.mapping}
                onChange={(m) => {
                  setDraft({ ...draft, mapping: m });
                  setResult(null);
                }}
              />
              {validation && validation.missingRequired.length > 0 && (
                <p className="text-sm text-negative">필수 컬럼을 찾을 수 없습니다: {validation.missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={convert} disabled={!!validation?.missingRequired.length}>
                  공통 형식으로 변환 · 검사
                </Button>
                {result && (
                  <Button onClick={register} disabled={!result.records.length} variant="default" className="bg-positive hover:bg-positive/90">
                    {formatNumber(result.records.length)}행 등록
                  </Button>
                )}
              </div>
              {result && <ResultSummary result={result} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>File Preview</CardTitle>
                <CardDescription>첫 15행 · 헤더 아래 파란 글씨가 인식된 공통 필드입니다</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <FilePreview table={draft.table} mapping={draft.mapping} />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>업로드 이력</CardTitle>
            <CardDescription>삭제하면 해당 파일로 등록된 데이터(sourceFileId 기준)도 함께 삭제됩니다</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <UploadHistoryTable uploads={uploads} onDelete={async (id) => void (await deleteUpload(id))} />
        </CardContent>
      </Card>

      <DuplicateDialog
        open={dup != null}
        duplicateCount={dup ?? 0}
        totalCount={result?.records.length ?? 0}
        onChoose={(mode) => {
          setDup(null);
          if (mode !== "cancel") void save(mode);
        }}
      />
    </div>
  );
}

function ResultSummary({ result }: { result: ParseResult }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>
          변환 성공 <b className="tabular">{formatNumber(result.records.length)}</b>행
        </span>
        <span>
          원본 <b className="tabular">{formatNumber(result.totalRows)}</b>행
        </span>
        <span>
          제외 <b className="tabular">{formatNumber(result.skippedRows)}</b>행
        </span>
        <span>데이터 기간 {result.dateRange ? `${result.dateRange.start} ~ ${result.dateRange.end}` : "-"}</span>
      </div>
      {[...result.warnings, ...result.errors].length > 0 && (
        <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs">
          {result.warnings.map((w, i) => (
            <li key={`w${i}`} className="flex items-start gap-1.5 text-warning">
              <FileWarning className="mt-0.5 size-3.5 shrink-0" /> {w.message}
            </li>
          ))}
          {result.errors.map((e, i) => (
            <li key={`e${i}`} className="flex items-start gap-1.5 text-negative">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {e.row ? `${e.row}행 ` : ""}
              {e.column ? `[${e.column}] ` : ""}
              {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
