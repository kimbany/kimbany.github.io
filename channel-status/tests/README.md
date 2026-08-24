# 검사

브라우저에서 실제로 띄워 확인하는 스크립트입니다. 저장소에 빌드 설정이 없어서
Playwright 는 이 폴더 밖에 따로 설치해 씁니다.

```bash
npm install playwright
node tests/로직검사.mjs     # 상태 정규화 · 병합 · 변동 판정 · KST 날짜 (27건)
node tests/csv검사.mjs      # 샘플 CSV 로 상품/상태 업로드 전 과정
node tests/초기화검사.mjs   # 전체 초기화가 새로고침 후에도 유지되는지
node tests/검사.mjs         # 네 화면 클릭 훑기 (예외·콘솔 오류 감시)
```

스크립트 안의 파일 경로는 `file:///home/user/...` 로 박혀 있으니 환경에 맞게 고쳐 쓰세요.

`csv검사.mjs` 는 파일 선택 대화상자만 대체하고 나머지 경로(파싱·병합·미리보기·저장)는 그대로 탑니다.
헤드리스 Chromium 이 `<input type=file>` 의 change 이벤트를 내보내지 않는 환경이 있어서입니다.
