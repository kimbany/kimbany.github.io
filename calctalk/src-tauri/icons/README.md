# 아이콘 (placeholder)

여기에 **계산기 아이콘** 세트를 넣어야 빌드됩니다. 임시로는 Tauri CLI가
하나의 PNG에서 전체 세트를 생성해 줍니다.

```bash
# 1024x1024 계산기 아이콘 PNG 하나 준비 후:
npx @tauri-apps/cli icon path/to/calculator-icon.png
```

위 명령이 다음 파일들을 자동 생성합니다:
- `32x32.png`, `128x128.png`, `128x128@2x.png`
- `icon.icns` (맥), `icon.ico` (윈도우), `icon.png`

윈도우/맥 기본 계산기와 비슷한 아이콘을 쓰면 위장 효과가 좋습니다.
(상표/저작권 주의: 본인용으로만)
