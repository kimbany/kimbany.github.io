/* 입력 화면 선택지. 원본 index.html 의 값을 그대로 옮겼다. */

export const GENDERS = [
  { value: 'male', label: '🚹 남자' },
  { value: 'female', label: '🚺 여자' },
  { value: 'pet', label: '🐶 반려동물' },
];

export const RELATION_CHIPS = [
  '친한 친구',
  '직장 윗사람(팀장님)',
  '직장 아랫사람(후임)',
  '친한 동생',
  '손위 형제(형/오빠/언니/누나)',
  '연인',
];

export const GENRES = [
  { value: 'yodel', label: '요들송' },
  { value: 'bollywood', label: '발리우드' },
  { value: 'hiphop', label: '힙합' },
  { value: 'rap', label: '랩' },
  { value: 'kpop', label: 'K-pop' },
  { value: 'ballad', label: '발라드' },
  { value: 'rock', label: '락' },
  { value: 'kids', label: '동요' },
  { value: 'lofi', label: '로파이' },
  { value: 'samba', label: '쌈바' },
  { value: 'random', label: '🎲 랜덤' },
  { value: 'trot', label: '트로트', soon: true },
  { value: 'ppongjjak', label: '뽕짝', soon: true },
];

/** 🎲 랜덤이 고를 수 있는 장르. 준비중 항목은 뽑히면 안 된다. */
export const RANDOM_GENRE_POOL = GENRES.filter(
  (g) => !g.soon && g.value !== 'random',
).map((g) => g.value);

export const VOICES = [
  { value: 'random', label: '🎲 랜덤' },
  { value: 'male', label: '🚹 남자' },
  { value: 'female', label: '🚺 여자' },
  { value: 'child', label: '🧒 어린이', soon: true },
  { value: 'group', label: '👥 그룹', soon: true },
  { value: 'duet', label: '🎭 듀엣', soon: true },
];

export const LANGS = [
  { value: 'ko', label: '🇰🇷 한국어' },
  { value: 'en', label: '🇺🇸 영어' },
  { value: 'mix', label: '🌏 섞기' },
];

const GENRE_LABEL = new Map(GENRES.map((g) => [g.value, g.label]));
const LANG_LABEL = new Map(LANGS.map((l) => [l.value, l.label]));

export function genreLabel(value) {
  return GENRE_LABEL.get(value) || value || '';
}

export function langLabel(value) {
  return LANG_LABEL.get(value) || value || '';
}
