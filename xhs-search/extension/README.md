# 샤오홍슈 검색기 헬퍼 (크롬 확장프로그램)

본인 브라우저 세션으로 샤오홍슈에 요청해서 결과를 `kimbany.github.io/xhs-search/`에 표시해주는 보조 확장입니다.

## 설치 (개발자 모드, 5분)

### 1. 폴더 다운로드
**옵션 A.** 저장소 통째로:
- https://github.com/kimbany/kimbany.github.io → "Code" 버튼 → "Download ZIP" → 압축 풀기
- `xhs-search/extension/` 폴더만 사용

**옵션 B.** Git 사용 가능하면:
```bash
git clone https://github.com/kimbany/kimbany.github.io.git
```

### 2. 크롬에 로드
1. 크롬 주소창에 `chrome://extensions` 입력 후 엔터
2. 오른쪽 위 **"개발자 모드"** 토글 켜기
3. 왼쪽 위 **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. 위에서 받은 `xhs-search/extension/` 폴더 선택
5. "샤오홍슈 검색기 헬퍼" 가 목록에 나타나면 성공

### 3. 샤오홍슈 로그인
- 크롬에서 https://www.xiaohongshu.com 열어 로그인
- (이미 로그인돼 있으면 패스)

### 4. 검색기 사이트 열기
- https://kimbany.github.io/xhs-search/ 새로고침
- 위에 **"✅ 크롬 확장 v1.0.0 감지됨"** 초록 메시지 뜨면 OK
- 한국어 입력 → 검색

## 동작 원리

```
[당신이 보는 검색기 페이지] ←postMessage→ [확장 content.js]
                                            ↓ chrome.runtime
                                          [확장 background.js]
                                            ↓ fetch (당신 쿠키 자동)
                                          [샤오홍슈 서버]
```

- 페이지는 절대 본인 쿠키를 직접 볼 수 없음 (확장만 다룸)
- 확장이 본인 브라우저에서 본인 계정으로 요청해줌 → 샤오홍슈가 정상 사용자로 인식

## 권한 설명

- `cookies`: 본인 샤오홍슈 세션 쿠키 사용 (확장이 다른 사이트에 노출하지 않음)
- `storage`: 향후 캐싱용 (지금은 미사용)
- `host_permissions: xiaohongshu.com, xhscdn.com`: 샤오홍슈 도메인에만 fetch 가능
- content script는 `kimbany.github.io`, localhost, file:// 페이지에만 주입됨

## 문제 해결

| 증상 | 원인 / 해결 |
|------|------------|
| "확장 미감지" | 확장 로드 안 됐거나 비활성화됨. `chrome://extensions`에서 토글 확인 |
| "HTTP 401" / "로그인" 페이지 응답 | 샤오홍슈 로그아웃 상태 → xiaohongshu.com 가서 로그인 |
| "확장 실패: Could not establish connection" | 확장 업데이트 후 사이트 새로고침(F5) 안 함. 새로고침 하세요 |
| 결과가 0개 | 검색어가 너무 좁거나, XHS가 패턴 바꿈. 다른 키워드로 시도 |

## 업데이트
저장소가 업데이트되면 위 1~2번 과정 다시 (또는 `chrome://extensions`에서 새로고침 아이콘 클릭).
