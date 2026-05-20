#!/usr/bin/env python3
"""랜덤픽! 아이콘 생성 스크립트.

분홍 배경(#FF4D8D)에 흰색 둥근 사각형 주사위(점 5개) + 하단 노란 알약 위에
검은 "랜덤픽!" 텍스트, 우상단에 노란 원 장식.
마스커블 버전은 모든 요소를 안전영역(80%) 안에 배치.

사용법:  python3 make_icons.py
"""
from PIL import Image, ImageDraw, ImageFont

PINK = (255, 77, 141)
YELLOW = (255, 217, 61)
WHITE = (255, 255, 255)
INK = (26, 26, 26)


def _font(size):
    for path in (
        "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), PINK)
    d = ImageDraw.Draw(img)

    # 마스커블이면 모든 요소를 중앙 80% 안에 배치
    inset = size * 0.10 if maskable else 0
    area = size - inset * 2
    x0 = inset

    # 우상단 노란 원 장식
    r = area * 0.16
    cx = x0 + area * 0.84
    cy = x0 + area * 0.16
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=YELLOW)

    # 중앙 흰색 둥근 사각형 주사위
    die = area * 0.46
    dx0 = x0 + (area - die) / 2
    dy0 = x0 + area * 0.16
    rounded(d, [dx0, dy0, dx0 + die, dy0 + die], radius=die * 0.22,
            fill=WHITE, outline=INK, width=max(2, int(size * 0.012)))

    # 주사위 5점
    pip = die * 0.11
    pad = die * 0.26
    pts = [
        (dx0 + pad, dy0 + pad),
        (dx0 + die - pad, dy0 + pad),
        (dx0 + die / 2, dy0 + die / 2),
        (dx0 + pad, dy0 + die - pad),
        (dx0 + die - pad, dy0 + die - pad),
    ]
    for px, py in pts:
        d.ellipse([px - pip, py - pip, px + pip, py + pip], fill=PINK)

    # 하단 노란 알약 + 검은 "랜덤픽!" 텍스트
    pill_w = area * 0.78
    pill_h = area * 0.20
    px0 = x0 + (area - pill_w) / 2
    py0 = x0 + area * 0.74
    rounded(d, [px0, py0, px0 + pill_w, py0 + pill_h], radius=pill_h / 2,
            fill=YELLOW, outline=INK, width=max(2, int(size * 0.012)))

    text = "랜덤픽!"
    fsize = int(pill_h * 0.62)
    font = _font(fsize)
    tb = d.textbbox((0, 0), text, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    d.text((px0 + (pill_w - tw) / 2 - tb[0],
            py0 + (pill_h - th) / 2 - tb[1]),
           text, font=font, fill=INK)

    return img


if __name__ == "__main__":
    draw_icon(192).save("icon-192.png")
    draw_icon(512).save("icon-512.png")
    draw_icon(512, maskable=True).save("icon-512-maskable.png")
    print("아이콘 3종 생성 완료: icon-192.png, icon-512.png, icon-512-maskable.png")
