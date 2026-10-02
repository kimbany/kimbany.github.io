"use client";

import { CopyMinus, Replace, X } from "lucide-react";
import type { DuplicateMode } from "@/types/upload";
import { formatNumber } from "@/lib/utils/format";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  duplicateCount: number;
  totalCount: number;
  onChoose: (mode: DuplicateMode | "cancel") => void;
}

/** 중복 데이터 처리 선택: 중복 제외 후 추가 / 기존 데이터 덮어쓰기 / 업로드 취소 */
export function DuplicateDialog({ open, duplicateCount, totalCount, onChoose }: Props) {
  const options = [
    { mode: "skip" as const, icon: CopyMinus, title: "중복 제외 후 추가", desc: `새로운 ${formatNumber(totalCount - duplicateCount)}행만 추가합니다. 기존 데이터는 유지됩니다.` },
    { mode: "overwrite" as const, icon: Replace, title: "기존 데이터 덮어쓰기", desc: `중복된 ${formatNumber(duplicateCount)}행을 이번 파일의 값으로 교체합니다.` },
    { mode: "cancel" as const, icon: X, title: "업로드 취소", desc: "아무것도 저장하지 않습니다." },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onChoose("cancel")}>
      <DialogContent>
        <DialogTitle>중복 데이터가 발견되었습니다</DialogTitle>
        <DialogDescription>
          전체 {formatNumber(totalCount)}행 중 {formatNumber(duplicateCount)}행이 이미 등록된 데이터와 같습니다. (플랫폼 · 브랜드 · 날짜 · 캠페인 · 광고그룹 · 광고 · 상품 · 키워드 기준)
        </DialogDescription>
        <div className="mt-4 space-y-2">
          {options.map((o) => (
            <button key={o.mode} onClick={() => onChoose(o.mode)} className="flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left hover:bg-muted">
              <o.icon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{o.title}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
