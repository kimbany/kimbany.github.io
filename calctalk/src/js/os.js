// =====================================================================
// os.js - OS 감지 (윈도우/맥 스타일 선택)
// ---------------------------------------------------------------------
// navigator 정보로 OS를 추정. Tauri에서는 더 정확한 API가 있지만
// 웹뷰의 userAgent로도 충분. 기본값은 윈도우.
// =====================================================================

export function detectOSStyle() {
  const p = (navigator.userAgent + " " + (navigator.platform || "")).toLowerCase();
  if (p.includes("mac")) return "mac";
  if (p.includes("win")) return "win";
  return "win";
}
