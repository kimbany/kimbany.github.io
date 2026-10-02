import type { AdRecord, CanonicalField, PlatformId } from "@/types/ad-data";

export interface FieldDefinition {
  field: CanonicalField;
  label: string;
  type: "date" | "string" | "number";
  /** 원본 컬럼명 후보 (앞쪽일수록 우선) */
  aliases: string[];
}

/**
 * 플랫폼 adapter. 원본 리포트 → 공통 AdRecord 변환 규칙을 정의한다.
 * 새로운 광고 플랫폼은 이 interface 를 구현해 registry 에 등록하면 된다.
 */
export interface PlatformParser {
  platform: PlatformId;
  label: string;
  fields: FieldDefinition[];
  /** 없으면 업로드 불가 */
  requiredFields: CanonicalField[];
  /** 없으면 경고 (분석 정확도 저하) */
  recommendedFields: CanonicalField[];
  /** 필드 매핑 후 플랫폼별 후처리 (기본값 채우기 등) */
  postProcess?: (record: AdRecord) => AdRecord;
  /** 업로드 화면 안내 문구 */
  guide: string;
}

export type ParseErrorCode =
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "READ_FAILED"
  | "MISSING_REQUIRED"
  | "INVALID_DATE"
  | "INVALID_NUMBER";

export class ParseError extends Error {
  constructor(
    public code: ParseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ParseError";
  }
}
