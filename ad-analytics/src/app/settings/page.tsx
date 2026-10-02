"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import type { AppSettings, MetricChangeRule, PositiveRule } from "@/types/settings";
import type { ComparisonBasis } from "@/types/alerts";
import type { ComparisonMode } from "@/types/analytics";
import { METRICS } from "@/lib/config/metrics";
import { BASIS_LABELS } from "@/lib/analytics/anomalies";
import { COMPARISON_MODE_LABELS } from "@/lib/analytics/period";
import { createId } from "@/lib/utils/id";
import { useSettingsStore } from "@/store/settings-store";
import { useDataStore } from "@/store/data-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "@/components/common/loading-state";

function NumberInput({ value, onChange, suffix, className, nullable }: { value: number | null; onChange: (v: number | null) => void; suffix?: string; className?: string; nullable?: boolean }) {
  return (
    <div className={`relative ${className ?? "w-24"}`}>
      <Input
        type="number"
        min={0}
        value={value ?? ""}
        placeholder={nullable ? "없음" : undefined}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onChange(nullable ? null : 0);
          else if (Number.isFinite(Number(v))) onChange(Math.max(0, Number(v)));
        }}
        className="h-8 pr-7 text-right text-sm tabular"
      />
      {suffix && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, loaded, save, reset } = useSettingsStore();
  const clearAll = useDataStore((s) => s.clearAll);
  const uploadedRows = useDataStore((s) => s.records.length);
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [newBrand, setNewBrand] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => setDraft(settings), [settings]);
  if (!loaded) return <LoadingState />;

  const t = draft.alertThresholds;
  const setT = (patch: Partial<AppSettings["alertThresholds"]>) => setDraft({ ...draft, alertThresholds: { ...t, ...patch } });
  const setRule = (id: string, patch: Partial<MetricChangeRule>) => setT({ metricRules: t.metricRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const setPos = (id: string, patch: Partial<PositiveRule>) => setT({ positiveRules: t.positiveRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const onSave = async () => {
    await save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 pb-20">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>브랜드</CardTitle>
              <CardDescription>업로드 시 선택할 브랜드 목록 · 필터에도 표시됩니다</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {draft.brands.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
                  {b.name}
                  <button
                    onClick={() => setDraft({ ...draft, brands: draft.brands.filter((x) => x.id !== b.id) })}
                    className="text-muted-foreground hover:text-negative"
                    aria-label={`${b.name} 삭제`}
                    disabled={draft.brands.length <= 1}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newBrand.trim();
                if (!name || draft.brands.some((b) => b.name === name)) return;
                setDraft({ ...draft, brands: [...draft.brands, { id: createId("brand"), name }] });
                setNewBrand("");
              }}
            >
              <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="새 브랜드 이름" className="h-8 text-sm" />
              <Button type="submit" size="sm" variant="outline">
                <Plus /> 추가
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>분석 기준</CardTitle>
              <CardDescription>이전 기간 비교 방식 · 목표 ROAS · 샘플 데이터</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>이전 기간 비교 방식</Label>
              <NativeSelect value={draft.comparisonMode} onChange={(e) => setDraft({ ...draft, comparisonMode: e.target.value as ComparisonMode })} className="w-48">
                {(Object.keys(COMPARISON_MODE_LABELS) as ComparisonMode[]).map((m) => (
                  <option key={m} value={m}>
                    {COMPARISON_MODE_LABELS[m]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>목표 ROAS</Label>
                <p className="text-[11px] text-muted-foreground">상품 · 키워드 · 캠페인 저효율 판정 기준</p>
              </div>
              <NumberInput value={draft.targetRoas} onChange={(v) => setDraft({ ...draft, targetRoas: v ?? 0 })} suffix="%" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>샘플(mock) 데이터 포함</Label>
                <p className="text-[11px] text-muted-foreground">실제 데이터 업로드 후에는 끄는 것을 권장합니다 (현재 업로드 {uploadedRows.toLocaleString("ko-KR")}행)</p>
              </div>
              <Switch checked={draft.useSampleData} onCheckedChange={(v) => setDraft({ ...draft, useSampleData: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Alert 기준 — 지표 변화율</CardTitle>
            <CardDescription>비교 기준 대비 변화율이 Warning 이상이면 Warning, Critical 이상이면 Critical 로 표시됩니다</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">사용</th>
                <th className="px-3 py-2 text-left font-medium">지표</th>
                <th className="px-3 py-2 text-left font-medium">방향</th>
                <th className="px-3 py-2 text-left font-medium">Warning</th>
                <th className="px-3 py-2 text-left font-medium">Critical</th>
              </tr>
            </thead>
            <tbody>
              {t.metricRules.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Switch checked={r.enabled} onCheckedChange={(v) => setRule(r.id, { enabled: v })} />
                  </td>
                  <td className="px-3 py-2 font-medium">{METRICS[r.metric].label}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.direction === "decrease" ? "negative" : "warning"}>{r.direction === "decrease" ? "하락" : "상승"}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput value={r.warningPct} onChange={(v) => setRule(r.id, { warningPct: v ?? 0 })} suffix="%" />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput value={r.criticalPct} nullable onChange={(v) => setRule(r.id, { criticalPct: v })} suffix="%" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>복합 조건</CardTitle>
              <CardDescription>여러 지표를 함께 보는 규칙</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Switch checked={t.spendSurge.enabled} onCheckedChange={(v) => setT({ spendSurge: { ...t.spendSurge, enabled: v } })} />
              광고비
              <NumberInput value={t.spendSurge.spendIncreasePct} onChange={(v) => setT({ spendSurge: { ...t.spendSurge, spendIncreasePct: v ?? 0 } })} suffix="%" className="w-20" />
              이상 증가 + 전환 증가율
              <NumberInput value={t.spendSurge.maxConversionGrowthPct} onChange={(v) => setT({ spendSurge: { ...t.spendSurge, maxConversionGrowthPct: v ?? 0 } })} suffix="%" className="w-20" />
              미만 → Warning
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Switch checked={t.zeroConversion.enabled} onCheckedChange={(v) => setT({ zeroConversion: { ...t.zeroConversion, enabled: v } })} />
              전환 0 + 광고비
              <NumberInput value={t.zeroConversion.minSpend} onChange={(v) => setT({ zeroConversion: { ...t.zeroConversion, minSpend: v ?? 0 } })} suffix="원" className="w-32" />
              이상 지출 → Warning (5배 이상 Critical)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Switch checked={t.cpaSurgeWithConversionGrowth.enabled} onCheckedChange={(v) => setT({ cpaSurgeWithConversionGrowth: { ...t.cpaSurgeWithConversionGrowth, enabled: v } })} />
              전환 증가 + CPA
              <NumberInput value={t.cpaSurgeWithConversionGrowth.cpaIncreasePct} onChange={(v) => setT({ cpaSurgeWithConversionGrowth: { ...t.cpaSurgeWithConversionGrowth, cpaIncreasePct: v ?? 0 } })} suffix="%" className="w-20" />
              이상 상승 → Warning
            </div>
            <div className="border-t pt-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">Positive (성과 개선)</div>
              <div className="space-y-2">
                {t.positiveRules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Switch checked={r.enabled} onCheckedChange={(v) => setPos(r.id, { enabled: v })} />
                    <span className="w-14 font-medium">{METRICS[r.metric].label}</span>
                    <NumberInput value={r.pct} onChange={(v) => setPos(r.id, { pct: v ?? 0 })} suffix="%" className="w-20" />
                    이상 {r.direction === "increase" ? "상승" : "하락"}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>비교 기준 · 노이즈 방지</CardTitle>
              <CardDescription>표본이 작은 대상은 평가하지 않아 오탐을 줄입니다</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BASIS_LABELS) as ComparisonBasis[]).map((b) => (
                <label key={b} className="flex items-center gap-2">
                  <Switch checked={t.bases[b]} onCheckedChange={(v) => setT({ bases: { ...t.bases, [b]: v } })} />
                  {BASIS_LABELS[b]}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Label>평가 최소 일 광고비</Label>
              <NumberInput value={t.minDailySpendForEvaluation} onChange={(v) => setT({ minDailySpendForEvaluation: v ?? 0 })} suffix="원" className="w-32" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>CVR / CPC 평가 최소 클릭수</Label>
              <NumberInput value={t.minClicksForRatio} onChange={(v) => setT({ minClicksForRatio: v ?? 0 })} suffix="회" className="w-32" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>데이터 관리</CardTitle>
            <CardDescription>브라우저에 저장된 업로드 데이터 · 업로드 이력을 모두 삭제합니다</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="text-negative" onClick={() => setConfirmClear(true)}>
            <Trash2 /> 업로드 데이터 전체 삭제
          </Button>
        </CardHeader>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-2 px-4 py-2.5 lg:px-6">
          {saved && <span className="text-xs text-positive">저장되었습니다</span>}
          {dirty && <span className="text-xs text-warning">저장하지 않은 변경사항이 있습니다</span>}
          <Button variant="ghost" size="sm" onClick={() => void reset()}>
            기본값으로 초기화
          </Button>
          <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setDraft(settings)}>
            취소
          </Button>
          <Button size="sm" disabled={!dirty} onClick={() => void onSave()}>
            <Save /> 저장
          </Button>
        </div>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogTitle>업로드 데이터 전체 삭제</DialogTitle>
          <DialogDescription>업로드한 광고 데이터 {uploadedRows.toLocaleString("ko-KR")}행과 업로드 이력을 모두 삭제합니다. 되돌릴 수 없습니다.</DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await clearAll();
                setConfirmClear(false);
              }}
            >
              전체 삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
