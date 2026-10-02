"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { UploadRecord } from "@/types/upload";
import { formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PlatformBadge } from "@/components/common/platform-badge";
import { DataTable, type Column } from "@/components/tables/data-table";

const STATUS = {
  success: { label: "완료", variant: "positive" as const },
  partial: { label: "일부 제외", variant: "warning" as const },
  failed: { label: "실패", variant: "negative" as const },
};

export function UploadHistoryTable({ uploads, onDelete }: { uploads: UploadRecord[]; onDelete: (id: string) => Promise<void> }) {
  const [target, setTarget] = useState<UploadRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const columns: Column<UploadRecord>[] = [
    { key: "uploadedAt", header: "Upload Date", sortValue: (u) => u.uploadedAt, render: (u) => new Date(u.uploadedAt).toLocaleString("ko-KR") },
    { key: "fileName", header: "File Name", sortValue: (u) => u.fileName, render: (u) => <span className="block max-w-56 truncate font-medium" title={u.fileName}>{u.fileName}</span> },
    { key: "platform", header: "Platform", sortValue: (u) => u.platform, render: (u) => <PlatformBadge platform={u.platform} short /> },
    { key: "brand", header: "Brand", sortValue: (u) => u.brand, render: (u) => u.brand },
    { key: "start", header: "Data Start Date", sortValue: (u) => u.dataStartDate, render: (u) => u.dataStartDate ?? "-" },
    { key: "end", header: "Data End Date", sortValue: (u) => u.dataEndDate, render: (u) => u.dataEndDate ?? "-" },
    {
      key: "rows",
      header: "Rows",
      align: "right",
      sortValue: (u) => u.rowCount,
      render: (u) => (
        <span title={u.duplicateCount ? `중복 ${u.duplicateCount}건 (${u.duplicateMode === "skip" ? "제외" : "덮어쓰기"})` : undefined}>
          {formatNumber(u.rowCount)}
          {!!u.duplicateCount && <span className="ml-1 text-[11px] text-muted-foreground">(중복 {formatNumber(u.duplicateCount)})</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", sortValue: (u) => u.status, render: (u) => <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setTarget(u)} aria-label="삭제">
          <Trash2 className="text-muted-foreground" />
        </Button>
      ),
    },
  ];
  return (
    <>
      <DataTable columns={columns} rows={uploads} rowKey={(u) => u.id} defaultSort={{ key: "uploadedAt", dir: "desc" }} emptyText="업로드 이력이 없습니다." />
      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogTitle>업로드 파일 삭제</DialogTitle>
          <DialogDescription>
            &quot;{target?.fileName}&quot; 업로드 이력과 이 파일로 등록된 광고 데이터 {formatNumber(target?.rowCount ?? 0)}행을 함께 삭제합니다. 되돌릴 수 없습니다.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!target) return;
                setBusy(true);
                await onDelete(target.id);
                setBusy(false);
                setTarget(null);
              }}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
