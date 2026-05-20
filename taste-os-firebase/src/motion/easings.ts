/**
 * Taste OS — emotional easings & durations.
 * Three curves, shared by every transition in the product.
 * Breath in, breath out, settle. Nothing is snappy.
 */

export const EASE = {
  breathIn: [0.16, 1, 0.3, 1],
  breathOut: [0.7, 0, 0.84, 0],
  settle: [0.34, 1.18, 0.64, 1],
} as const;

export const DURATION = {
  reveal: 1.8,
  exit: 1.4,
  settle: 0.7,
  atmosphere: 2.4,
  page: 1.4,
} as const;

/** the breath of silence held between narration lines (seconds) */
export const SILENCE = 1.4;
