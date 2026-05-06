# Blog Media Downloader

블로그 글 URL 하나만 주면 페이지 안의 **이미지 / GIF / 동영상**을 통째로 받아주는 파이썬 스크립트입니다.
브라우저 개발자도구(F12) → Network 탭에서 한땀한땀 찾던 작업을 자동화합니다.

## 지원

- 일반 HTML 블로그 (워드프레스, 정적 사이트 등)
- 네이버 블로그 (`blog.naver.com` — `mainFrame` iframe 자동 추적, 썸네일 파라미터 제거 → 원본 화질)
- 티스토리 / 다음 블로그
- `<img>`, `<source>`, `<video>`, `srcset`, lazy-load 속성(`data-src`, `data-original` 등)
- 본문에 박혀있는 `.mp4`, `.webm`, `.m3u8`, `.gif` 직링크

## 설치

```bash
pip install -r requirements.txt
```

## 사용법

```bash
python download.py <블로그 URL> [-o 저장폴더]
```

예:

```bash
python download.py https://blog.naver.com/someuser/223456789
python download.py https://example.tistory.com/12 -o ./my_save
```

## 주의

- 저작권이 있는 콘텐츠는 개인 보관 외 용도로 재배포하지 마세요.
- `.m3u8`(HLS 스트리밍)은 매니페스트만 받아집니다. 실제 영상으로 합치려면 `ffmpeg`를 별도로 사용하세요:
  ```bash
  ffmpeg -i downloaded/001_video.m3u8 -c copy out.mp4
  ```
