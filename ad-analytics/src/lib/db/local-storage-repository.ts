import type { AdRecord } from "@/types/ad-data";
import type { AppSettings } from "@/types/settings";
import type { UploadRecord } from "@/types/upload";
import { dedupeKeyOf, StorageQuotaError, type AdDataRepository } from "./repository";

const PREFIX = "ad-analytics:v1";
const KEYS = {
  records: `${PREFIX}:records`,
  uploads: `${PREFIX}:uploads`,
  settings: `${PREFIX}:settings`,
};

/**
 * localStorage 용량(약 5MB)을 아끼기 위해 레코드를 컬럼 순서 고정 튜플로 압축 저장한다.
 * 새 필드는 COLUMNS 끝에 추가하면 이전 데이터와 호환된다.
 */
const COLUMNS = [
  "id", "sourceFileId", "date", "platform", "brand", "campaign", "adGroup", "ad", "product", "keyword",
  "spend", "impressions", "clicks", "conversions", "revenue",
  "reach", "frequency", "videoViews", "addToCart", "landingPageViews", "orders",
  "device", "placement", "creative", "extra",
] as const satisfies readonly (keyof AdRecord)[];

type Packed = unknown[];

function pack(r: AdRecord): Packed {
  const row = COLUMNS.map((c) => (r[c] === undefined ? null : r[c]));
  while (row.length && row[row.length - 1] === null) row.pop();
  return row;
}

function unpack(row: Packed): AdRecord {
  const r: Record<string, unknown> = {};
  COLUMNS.forEach((c, i) => {
    const v = row[i];
    if (v !== null && v !== undefined) r[c] = v;
  });
  for (const c of ["campaign", "adGroup", "ad", "product", "keyword"]) if (r[c] == null) r[c] = "";
  for (const c of ["spend", "impressions", "clicks", "conversions", "revenue"]) if (r[c] == null) r[c] = 0;
  return r as unknown as AdRecord;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) throw new StorageQuotaError();
    throw e;
  }
}

export class LocalStorageRepository implements AdDataRepository {
  private cache: AdRecord[] | null = null;

  async listRecords(): Promise<AdRecord[]> {
    if (!this.cache) this.cache = read<Packed[]>(KEYS.records, []).map(unpack);
    return this.cache;
  }

  private async persist(records: AdRecord[]) {
    write(KEYS.records, records.map(pack));
    this.cache = records;
  }

  async insertRecords(records: AdRecord[], replaceKeys?: Set<string>): Promise<void> {
    const existing = await this.listRecords();
    const kept = replaceKeys?.size ? existing.filter((r) => !replaceKeys.has(dedupeKeyOf(r))) : existing;
    await this.persist([...kept, ...records]);
  }

  async deleteRecordsBySource(sourceFileId: string): Promise<number> {
    const existing = await this.listRecords();
    const kept = existing.filter((r) => r.sourceFileId !== sourceFileId);
    await this.persist(kept);
    return existing.length - kept.length;
  }

  async clearRecords(): Promise<void> {
    await this.persist([]);
    write(KEYS.uploads, []);
  }

  async listUploads(): Promise<UploadRecord[]> {
    return read<UploadRecord[]>(KEYS.uploads, []);
  }

  async insertUpload(upload: UploadRecord): Promise<void> {
    write(KEYS.uploads, [upload, ...(await this.listUploads())]);
  }

  async deleteUpload(id: string): Promise<void> {
    write(KEYS.uploads, (await this.listUploads()).filter((u) => u.id !== id));
  }

  async getSettings(): Promise<AppSettings | null> {
    return read<AppSettings | null>(KEYS.settings, null);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    write(KEYS.settings, settings);
  }
}
