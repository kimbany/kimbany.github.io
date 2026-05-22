#!/usr/bin/env python3
"""calc-chat 아이콘 생성 스크립트 (클레이모피즘 계산기 아이콘).

기획서 스펙대로 재현:
  - 흰색 스퀘어클(둥근 사각형, 모서리 ~22%) + 부드러운 드롭 섀도우
  - 우하단 연보라(#B4ABE8) 블록
  - 좌상 +, 우상 × (차콜 #2D2D3A) / 좌하 − (차콜) / 우하 = (보라 위 흰색)

원본 이미지가 환경에 들어오지 않아 설명 기반으로 벡터 재현한 것.
실제 첨부 이미지가 있으면 PNG만 교체하면 됨.

사용법:  python3 make_icons.py
"""
import os
from PIL import Image, ImageDraw, ImageChops, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

M = 1024  # 마스터 해상도
WHITE = (255, 255, 255, 255)
PURPLE = (180, 171, 232, 255)   # #B4ABE8
CHARCOAL = (45, 45, 58, 255)    # #2D2D3A

# 스퀘어클 박스 (그림자 여백 남김)
SQ = (102, 86, 922, 906)        # left, top, right, bottom (=820px)
RAD = 180                       # ~22%

# 심볼 중심 (실제 이미지에 맞춘 위치)
POS = {
    "plus":  (363, 343),
    "times": (663, 343),
    "minus": (363, 658),
    "equal": (676, 660),
}

# 우하단 보라 블록 (스퀘어클 우하단 모서리에 맞춤)
BLOCK = (527, 470, 922, 906)
BLOCK_RAD_OUT = RAD   # 우하단 모서리 = 스퀘어클과 동일
BLOCK_RAD_IN = 56     # 좌상단(내부) 모서리


def squircle_mask():
    m = Image.new("L", (M, M), 0)
    ImageDraw.Draw(m).rounded_rectangle(SQ, radius=RAD, fill=255)
    return m


def capsule(size, length, thick, fill):
    """가로 캡슐(둥근 막대)을 그린 RGBA 타일 반환."""
    t = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    x0 = (size - length) // 2
    y0 = (size - thick) // 2
    d.rounded_rectangle([x0, y0, x0 + length, y0 + thick],
                        radius=thick // 2, fill=fill)
    return t


def glyph(kind, fill):
    """심볼 타일(RGBA, 360x360) 생성."""
    S = 360
    L, T = 176, 52          # 막대 길이/두께
    t = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if kind == "minus":
        t.alpha_composite(capsule(S, L, T, fill))
    elif kind == "plus":
        t.alpha_composite(capsule(S, L, T, fill))               # 가로
        v = capsule(S, L, T, fill).rotate(90)                   # 세로
        t.alpha_composite(v)
    elif kind == "times":
        base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        base.alpha_composite(capsule(S, L, T, fill))
        base.alpha_composite(capsule(S, L, T, fill).rotate(90))
        t.alpha_composite(base.rotate(45, resample=Image.BICUBIC))
    elif kind == "equal":
        gap = 56
        top = capsule(S, L, T, fill)
        t.alpha_composite(top, (0, -gap // 2 - T // 2 + 0))
        t.alpha_composite(top, (0,  gap // 2 + T // 2 - 0))
    return t


def place(canvas, tile, center):
    x = int(center[0] - tile.width / 2)
    y = int(center[1] - tile.height / 2)
    canvas.alpha_composite(tile, (x, y))


def render_master(maskable=False):
    img = Image.new("RGBA", (M, M), (0, 0, 0, 0))
    sqmask = squircle_mask()

    if maskable:
        # 마스커블: 전체를 흰색으로 채우고(블리드), 콘텐츠는 안전영역(80%) 안
        img = Image.new("RGBA", (M, M), WHITE)
    else:
        # 드롭 섀도우
        sh = Image.new("RGBA", (M, M), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            [SQ[0], SQ[1] + 30, SQ[2], SQ[3] + 30], radius=RAD,
            fill=(90, 80, 150, 90))
        sh = sh.filter(ImageFilter.GaussianBlur(34))
        img.alpha_composite(sh)
        # 흰 스퀘어클
        white = Image.new("RGBA", (M, M), WHITE)
        img.paste(white, (0, 0), sqmask)

    # 보라 블록: 우/하단은 스퀘어클 모서리에 flush, 좌상단(내부)만 둥글게
    pl = Image.new("L", (M, M), 0)
    pd = ImageDraw.Draw(pl)
    bx, by = BLOCK[0], BLOCK[1]
    rin = 70                      # 내부(좌상단) 코너 반경
    EXT = M + 200                 # 우/하단은 캔버스 밖까지 → 스퀘어클로 잘려 flush
    pd.rectangle([bx + rin, by, EXT, EXT], fill=255)
    pd.rectangle([bx, by + rin, EXT, EXT], fill=255)
    pd.pieslice([bx, by, bx + 2 * rin, by + 2 * rin], 180, 270, fill=255)
    if not maskable:
        pl = ImageChops.multiply(pl, sqmask)
    purple = Image.new("RGBA", (M, M), PURPLE)
    img.paste(purple, (0, 0), pl)

    # 심볼
    place(img, glyph("plus",  CHARCOAL), POS["plus"])
    place(img, glyph("times", CHARCOAL), POS["times"])
    place(img, glyph("minus", CHARCOAL), POS["minus"])
    place(img, glyph("equal", WHITE),    POS["equal"])
    return img


def main():
    normal = render_master(maskable=False)
    maskable = render_master(maskable=True)

    sizes = [512, 192, 180, 152, 120, 96, 72]
    for s in sizes:
        normal.resize((s, s), Image.LANCZOS).save(
            os.path.join(OUT, f"icon-{s}.png"))
    for s in (32, 16):
        normal.resize((s, s), Image.LANCZOS).save(
            os.path.join(OUT, f"favicon-{s}.png"))

    # 마스커블 (안전영역 80% 안에 콘텐츠가 들어가도록 전체를 살짝 축소)
    safe = Image.new("RGBA", (M, M), WHITE)
    inner = maskable.resize((int(M * 0.82), int(M * 0.82)), Image.LANCZOS)
    safe.alpha_composite(inner, ((M - inner.width) // 2, (M - inner.height) // 2))
    safe.resize((512, 512), Image.LANCZOS).save(
        os.path.join(OUT, "maskable-icon-512.png"))

    # favicon.ico (멀티 사이즈)
    normal.resize((256, 256), Image.LANCZOS).save(
        os.path.join(OUT, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48)])

    print("생성 완료:")
    for f in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, f)
        print(f"  icons/{f}  ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
