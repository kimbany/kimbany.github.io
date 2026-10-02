"use client";

import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";

/** 로딩 / 데이터 없음 상태를 일관되게 처리 */
export function DataGuard({
  ready,
  hasAnyData,
  hasRangeData = true,
  children,
}: {
  ready: boolean;
  hasAnyData: boolean;
  hasRangeData?: boolean;
  children: React.ReactNode;
}) {
  if (!ready) return <LoadingState />;
  if (!hasAnyData)
    return <EmptyState title="아직 등록된 광고 데이터가 없습니다." description="Data Management 에서 광고 보고서를 업로드하거나, Settings 에서 샘플 데이터를 켜주세요." />;
  if (!hasRangeData) return <EmptyState description="기간 필터를 변경하거나 Data Management 에서 광고 보고서를 업로드해주세요." />;
  return <>{children}</>;
}
