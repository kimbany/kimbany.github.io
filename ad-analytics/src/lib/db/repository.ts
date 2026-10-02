/**
 * 데이터 저장소 인터페이스.
 * 1차 버전은 LocalStorageRepository 를 사용하며, 이후 Supabase / PostgreSQL 구현체를 만들어
 * lib/db/index.ts 의 getRepository() 만 교체하면 된다. (모든 메서드는 async)
 *
 * PostgreSQL 테이블 대응 예시
 *  ad_records(id pk, source_file_id fk, date, platform, brand, campaign, ad_group, ad, product, keyword,
 *             spend, impressions, clicks, conversions, revenue, ... , unique(dedupe_key))
 *  uploads(id pk, uploaded_at, file_name, platform, brand, data_start_date, data_end_date, row_count, status)
 *  settings(id pk, value jsonb)
 */
import type { AdRecord } from "@/types/ad-data";
import type { AppSettings } from "@/types/settings";
import type { UploadRecord } from "@/types/upload";

export interface AdDataRepository {
  listRecords(): Promise<AdRecord[]>;
  /** 레코드 추가. replaceKeys 에 포함된 dedupe key 를 가진 기존 레코드는 먼저 삭제된다 (덮어쓰기) */
  insertRecords(records: AdRecord[], replaceKeys?: Set<string>): Promise<void>;
  deleteRecordsBySource(sourceFileId: string): Promise<number>;
  clearRecords(): Promise<void>;

  listUploads(): Promise<UploadRecord[]>;
  insertUpload(upload: UploadRecord): Promise<void>;
  deleteUpload(id: string): Promise<void>;

  getSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;
}

/** 중복 판정 키: platform + brand + date + campaign + adGroup + ad + product + keyword (+ device/placement 세분화) */
export function dedupeKeyOf(r: AdRecord): string {
  return [r.platform, r.brand, r.date, r.campaign, r.adGroup, r.ad, r.product, r.keyword, r.device ?? "", r.placement ?? ""].join("␟");
}

export class StorageQuotaError extends Error {
  constructor() {
    super("브라우저 저장 공간이 부족합니다. 오래된 업로드를 삭제하거나 DB 연동을 검토해주세요.");
  }
}
