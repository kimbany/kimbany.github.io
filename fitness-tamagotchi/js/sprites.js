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

  const SPRITES = { happy: HAPPY, normal: NORMAL, tired: TIRED, sick: SICK };

  const PALETTES = {
    happy:  { O:'#0a1a0a', B:'#6cf06c', D:'#3aa83a', L:'#b8ffb8', P:'#0a1a0a', M:'#3a1818', C:'#ff8aa8', S:'#7ab8ff' },
    normal: { O:'#1a1208', B:'#ffd84a', D:'#a07a10', L:'#fff0a8', P:'#1a1208', M:'#3a2818', C:'#ff8aa8', S:'#7ab8ff' },
    tired:  { O:'#1a0a1a', B:'#a888c8', D:'#503060', L:'#d8c0e8', P:'#1a0a1a', M:'#3a2818', C:'#ff8aa8', S:'#7ab8ff' },
    sick:   { O:'#0a1a18', B:'#7a8a7a', D:'#2a3a2a', L:'#a8b8a8', P:'#1a0a1a', M:'#1a0a0a', C:'#ff8aa8', S:'#7ab8ff' },
  };

  function draw(canvas, mood, frame = 0) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const sprite = SPRITES[mood] || SPRITES.normal;
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

    // Ground shadow (stays put while character bounces)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(offX + cell * 4, baseY + cell * 15 + cell, cell * 8, Math.max(1, Math.floor(cell / 2)));

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
  }

  return { draw };
})();
