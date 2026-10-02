import type { PlatformId } from "@/types/ad-data";
import { metaParser } from "./meta";
import { naverPowerlinkParser } from "./naver-powerlink";
import { naverShoppingParser } from "./naver-shopping";
import type { PlatformParser } from "./types";

/** 플랫폼 parser 레지스트리. Google / Kakao / Coupang 추가 시 여기에 등록 */
export const PARSERS: Record<PlatformId, PlatformParser> = {
  meta: metaParser,
  naver_shopping: naverShoppingParser,
  naver_powerlink: naverPowerlinkParser,
};

export function getParser(platform: PlatformId): PlatformParser {
  return PARSERS[platform];
}
