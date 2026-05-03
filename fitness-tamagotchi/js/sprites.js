// Pixel character sprites (16x16) and renderer.
// Legend per pixel:
//   . = transparent
//   O = outline   B = body fill    D = body shadow   L = body highlight
//   P = pupil/eye M = mouth        C = cheek         S = sweat drop

const Sprites = (() => {

  const HAPPY = [
    "................",
    "................",
    ".....OOOOOO.....",
    "....OBBBBBBO....",
    "...OBLLLLLLBO...",
    "..OBLLLLLLLLBO..",
    "..OBLLLLLLLLBO..",
    "..OBBPBBBBPBBO..",
    "..OBBBBBBBBBBO..",
    "..OCBBBBBBBBCO..",
    "..OBBBMBBMBBBO..",
    "..OBBBBMMBBBBO..",
    "...OBBBBBBBBO...",
    "....OBDDDDDBO...",
    ".....OBDDBO.....",
    "......OBBO......",
  ];

  const NORMAL = [
    "................",
    "................",
    ".....OOOOOO.....",
    "....OBBBBBBO....",
    "...OBBBBBBBBO...",
    "..OBBBBBBBBBBO..",
    "..OBBBBBBBBBBO..",
    "..OBBPBBBBPBBO..",
    "..OBBBBBBBBBBO..",
    "..OBBBBBBBBBBO..",
    "..OBBBBMMBBBBO..",
    "..OBBBBBBBBBBO..",
    "...OBBBBBBBBO...",
    "....OBDDDDDBO...",
    ".....OBDDBO.....",
    "......OBBO......",
  ];

  const TIRED = [
    "................",
    "................",
    ".....OOOOOO.....",
    "....OBBBBBBO..S.",
    "...OBBBBBBBBO.S.",
    "..OBBBBBBBBBBO..",
    "..OBBBBBBBBBBO..",
    "..OBPPBBBBPPBO..",
    "..OBBBBBBBBBBO..",
    "..OBBBBBBBBBBO..",
    "..OBBBBMMBBBBO..",
    "..OBBBBBBBBBBO..",
    "...OBBBBBBBBO...",
    "....OBDDDDDBO...",
    ".....OBDDBO.....",
    "......OBBO......",
  ];

  const SICK = [
    "................",
    "................",
    ".....OOOOOO.....",
    "....OBBBBBBO..S.",
    "...OBBBBBBBBO.SS",
    "..OBBBBBBBBBBOS.",
    "..OBPBPBBPBPBO..",
    "..OBBPBBBBPBBO..",
    "..OBPBPBBPBPBO..",
    "..OBBBBBBBBBBO..",
    "..OBBBMMMMBBBO..",
    "..OBBBBMMBBBBO..",
    "...OBBBBBBBBO...",
    "....OBDDDDDBO...",
    ".....OBDDBO.....",
    "......OBBO......",
  ];

  // ---- BABY 단계 (LV 1-9) — 더 작고 동글한 아기 모습 ----
  const BABY_HAPPY = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "......OOOO......",
    ".....OBLLBO.....",
    "....OBPBBPBO....",
    "....OBBBBBBO....",
    "....OCBBBBCO....",
    "....OBBMMBBO....",
    ".....OBBBBO.....",
    "......OBBO......",
    "......OOOO......",
    "................",
    "................",
  ];
  const BABY_NORMAL = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "......OOOO......",
    ".....OBBBBO.....",
    "....OBPBBPBO....",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBMMBBO....",
    ".....OBBBBO.....",
    "......OBBO......",
    "......OOOO......",
    "................",
    "................",
  ];
  const BABY_TIRED = [
    "................",
    "................",
    "................",
    "................",
    ".............S..",
    "......OOOO...S..",
    ".....OBBBBO.....",
    "....OBPPPPBO....",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBMMBBO....",
    ".....OBBBBO.....",
    "......OBBO......",
    "......OOOO......",
    "................",
    "................",
  ];
  const BABY_SICK = [
    "................",
    "................",
    "................",
    "............SS..",
    ".............S..",
    "......OOOO...SS.",
    ".....OBBBBO.....",
    "....OBPBBPBO....",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBMMMMBO....",
    ".....OBBBBO.....",
    "......OBBO......",
    "......OOOO......",
    "................",
    "................",
  ];

  // ---- WANG/KING 오버레이 (LV 20+) — 어른 + 왕관 ----
  // 16x16 grid; '.' = 무시(투명), 'Y' = 금색, 'K' = 반짝이
  const CROWN_OVERLAY = [
    "................",
    "....KYYY.YYYK...",
    "....YOYYYYYO....",
    "....YYYYYYYY....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ];

  const SPRITES = {
    baby:  { happy: BABY_HAPPY,  normal: BABY_NORMAL,  tired: BABY_TIRED,  sick: BABY_SICK  },
    adult: { happy: HAPPY,       normal: NORMAL,       tired: TIRED,       sick: SICK       },
    king:  { happy: HAPPY,       normal: NORMAL,       tired: TIRED,       sick: SICK       },  // body same as adult, crown drawn on top
  };

  const PALETTES = {
    happy:  { O:'#0a1a0a', B:'#6cf06c', D:'#3aa83a', L:'#b8ffb8', P:'#0a1a0a', M:'#3a1818', C:'#ff8aa8', S:'#7ab8ff', Y:'#ffd84a', K:'#ffffff' },
    normal: { O:'#1a1208', B:'#ffd84a', D:'#a07a10', L:'#fff0a8', P:'#1a1208', M:'#3a2818', C:'#ff8aa8', S:'#7ab8ff', Y:'#ffd84a', K:'#ffffff' },
    tired:  { O:'#1a0a1a', B:'#a888c8', D:'#503060', L:'#d8c0e8', P:'#1a0a1a', M:'#3a2818', C:'#ff8aa8', S:'#7ab8ff', Y:'#ffd84a', K:'#ffffff' },
    sick:   { O:'#0a1a18', B:'#7a8a7a', D:'#2a3a2a', L:'#a8b8a8', P:'#1a0a1a', M:'#1a0a0a', C:'#ff8aa8', S:'#7ab8ff', Y:'#ffd84a', K:'#ffffff' },
  };

  // draw(canvas, mood, stage='adult', frame=0)
  //   mood:  'happy' | 'normal' | 'tired' | 'sick'
  //   stage: 'baby'  | 'adult'  | 'king'
  function draw(canvas, mood, stage = 'adult', frame = 0) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const stageSprites = SPRITES[stage] || SPRITES.adult;
    const sprite = stageSprites[mood] || stageSprites.normal;
    const pal = PALETTES[mood] || PALETTES.normal;
    const w = canvas.width;
    const h = canvas.height;
    const cell = Math.max(1, Math.floor(Math.min(w, h) / 16));
    const gridW = cell * 16;
    const offX = Math.floor((w - gridW) / 2);
    const baseY = Math.floor((h - gridW) / 2);
    const bounce = frame ? -cell : 0;
    const offY = baseY + bounce;

    ctx.clearRect(0, 0, w, h);

    // Ground shadow — baby is smaller so smaller shadow
    const shadowW = stage === 'baby' ? cell * 6 : cell * 8;
    const shadowX = offX + Math.floor((gridW - shadowW) / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(shadowX, baseY + cell * 15 + cell, shadowW, Math.max(1, Math.floor(cell / 2)));

    // Body sprite
    for (let y = 0; y < 16; y++) {
      const row = sprite[y];
      for (let x = 0; x < 16; x++) {
        const ch = row[x];
        if (!ch || ch === '.') continue;
        const color = pal[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
      }
    }

    // King overlay — crown
    if (stage === 'king') {
      for (let y = 0; y < 16; y++) {
        const row = CROWN_OVERLAY[y];
        for (let x = 0; x < 16; x++) {
          const ch = row[x];
          if (!ch || ch === '.') continue;
          const color = pal[ch];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
        }
      }
    }
  }

  return { draw };
})();
