#!/usr/bin/env python3
"""
Blog Media Downloader

블로그 URL을 받아 페이지 안의 이미지(jpg/png/webp), GIF, 동영상(mp4/webm/m3u8 등)을
일괄 다운로드합니다. 네이버 블로그, 티스토리, 일반 워드프레스/HTML 블로그를 지원합니다.

사용법:
    python download.py <블로그 URL> [-o 저장폴더]

예시:
    python download.py https://blog.naver.com/someuser/223456789
    python download.py https://example.tistory.com/12 -o ./downloaded
"""

import argparse
import os
import re
import sys
import mimetypes
from urllib.parse import urljoin, urlparse, unquote

import requests
from bs4 import BeautifulSoup

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"}
VIDEO_EXTS = {".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv", ".m3u8", ".ts"}
MEDIA_EXTS = IMAGE_EXTS | VIDEO_EXTS


def make_session(referer: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": UA,
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": referer,
    })
    return s


def fetch_html(session: requests.Session, url: str) -> tuple[str, str]:
    """HTML을 받아오고, iframe 기반 블로그(네이버 등)는 실제 본문 URL로 따라간다."""
    r = session.get(url, timeout=20)
    r.raise_for_status()
    html = r.text
    final_url = r.url

    # 네이버 블로그: 본문이 mainFrame iframe 안에 있음
    if "blog.naver.com" in final_url:
        m = re.search(r'mainFrame["\']?\s*src=["\']([^"\']+)', html)
        if m:
            inner = urljoin(final_url, m.group(1))
            r2 = session.get(inner, timeout=20)
            r2.raise_for_status()
            return r2.text, r2.url

    return html, final_url


def normalize_naver_image(url: str) -> str:
    """네이버 블로그 이미지의 ?type=w… 썸네일 파라미터 제거 → 원본 화질"""
    if "pstatic.net" in url or "naver.net" in url:
        return re.sub(r"\?type=.*$", "", url)
    return url


def guess_ext(url: str, content_type: str | None) -> str:
    path = urlparse(url).path
    _, ext = os.path.splitext(path)
    if ext.lower() in MEDIA_EXTS:
        return ext.lower()
    if content_type:
        ct = content_type.split(";")[0].strip()
        ext_guess = mimetypes.guess_extension(ct) or ""
        if ext_guess:
            return ext_guess
    return ".bin"


def safe_filename(url: str, idx: int, ext: str) -> str:
    base = os.path.basename(urlparse(url).path) or f"file_{idx}"
    base = unquote(base)
    base = re.sub(r"[^\w\-.]+", "_", base)[:80]
    name, cur_ext = os.path.splitext(base)
    if not name:
        name = f"file_{idx}"
    if cur_ext.lower() not in MEDIA_EXTS:
        return f"{idx:03d}_{name}{ext}"
    return f"{idx:03d}_{name}{cur_ext}"


def collect_media_urls(html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    found: list[str] = []

    def add(u: str | None):
        if not u:
            return
        u = u.strip()
        if u.startswith("data:") or u.startswith("javascript:"):
            return
        absu = urljoin(base_url, u)
        absu = normalize_naver_image(absu)
        if absu not in found:
            found.append(absu)

    # <img>
    for img in soup.find_all("img"):
        add(img.get("src"))
        add(img.get("data-src"))
        add(img.get("data-lazy-src"))
        add(img.get("data-original"))
        srcset = img.get("srcset") or img.get("data-srcset")
        if srcset:
            # 가장 큰 해상도 후보 선택
            candidates = [s.strip().split(" ")[0] for s in srcset.split(",") if s.strip()]
            if candidates:
                add(candidates[-1])

    # <source> (picture / video)
    for src in soup.find_all("source"):
        add(src.get("src"))
        srcset = src.get("srcset")
        if srcset:
            candidates = [s.strip().split(" ")[0] for s in srcset.split(",") if s.strip()]
            if candidates:
                add(candidates[-1])

    # <video>, <audio>
    for v in soup.find_all(["video", "audio"]):
        add(v.get("src"))
        add(v.get("poster"))

    # <a href="...mp4|gif|jpg...">
    for a in soup.find_all("a", href=True):
        href = a["href"]
        ext = os.path.splitext(urlparse(href).path)[1].lower()
        if ext in MEDIA_EXTS:
            add(href)

    # 본문 HTML 어딘가에 박혀있는 mp4/m3u8 URL 정규식으로 긁기 (티스토리/카카오TV/네이버TV 등)
    raw_urls = re.findall(
        r'https?://[^\s"\'<>]+?\.(?:mp4|webm|m3u8|gif|png|jpe?g|webp)(?:\?[^\s"\'<>]*)?',
        html,
        flags=re.IGNORECASE,
    )
    for u in raw_urls:
        add(u)

    return found


def download_one(session: requests.Session, url: str, out_dir: str, idx: int) -> str | None:
    try:
        with session.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            ext = guess_ext(url, r.headers.get("Content-Type"))
            fname = safe_filename(url, idx, ext)
            fpath = os.path.join(out_dir, fname)
            with open(fpath, "wb") as f:
                for chunk in r.iter_content(chunk_size=64 * 1024):
                    if chunk:
                        f.write(chunk)
            return fpath
    except requests.RequestException as e:
        print(f"  [실패] {url} -> {e}", file=sys.stderr)
        return None


def main() -> int:
    ap = argparse.ArgumentParser(description="블로그 미디어(이미지/GIF/영상) 일괄 다운로더")
    ap.add_argument("url", help="블로그 글 URL")
    ap.add_argument("-o", "--out", default="downloaded", help="저장 폴더 (기본: downloaded)")
    args = ap.parse_args()

    session = make_session(referer=args.url)
    print(f"[1/3] 페이지 로드: {args.url}")
    html, final_url = fetch_html(session, args.url)

    print(f"[2/3] 미디어 URL 수집 중… (실제 본문: {final_url})")
    urls = collect_media_urls(html, final_url)
    if not urls:
        print("미디어를 찾지 못했습니다.")
        return 1
    print(f"  -> {len(urls)}개 발견")

    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)

    # 이후 다운로드 요청에는 본문 URL을 Referer로 (핫링크 방지 우회)
    session.headers["Referer"] = final_url

    print(f"[3/3] 다운로드 시작 -> {out_dir}/")
    saved = 0
    for i, u in enumerate(urls, 1):
        print(f"  ({i}/{len(urls)}) {u}")
        if download_one(session, u, out_dir, i):
            saved += 1

    print(f"\n완료: {saved}/{len(urls)} 저장됨 ({out_dir}/)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
