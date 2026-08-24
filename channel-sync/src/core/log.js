const t = () => new Date().toISOString().slice(11, 19);
const paint = (c, s) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s);

export const log = {
  info: (...a) => console.log(paint(90, `[${t()}]`), ...a),
  ok: (...a) => console.log(paint(90, `[${t()}]`), paint(32, '✓'), ...a),
  warn: (...a) => console.log(paint(90, `[${t()}]`), paint(33, '!'), ...a),
  fail: (...a) => console.log(paint(90, `[${t()}]`), paint(31, '✗'), ...a),
  step: (s) => console.log(paint(90, `[${t()}]`), paint(36, '›'), s),
};
