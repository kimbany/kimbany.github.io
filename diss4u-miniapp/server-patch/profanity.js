/*
 * 비속어 마스킹 (강화판).
 *
 * 기존 proxy/server.js 의 maskProfanity 는 정규식 2개 + 16단어 블랙리스트였다.
 * 비게임 심사 체크리스트에 "미니앱 문구에 비속어, 은어, 과도한 유행어가 포함되지
 * 않아요" 항목이 있고, '놀리는 노래'라는 컨셉상 여기가 반려 1순위다.
 *
 * 원본이 놓치던 우회들:
 *   씨 발 / 씨-발 / 씨.발   → 사이에 낀 구분자
 *   ㅅㅂ / ㅄ / ㅈㄴ        → 초성만 (일부만 잡혔다)
 *   시1발 / 시8발           → 숫자 삽입
 *   씨이발 / 존나아          → 글자 반복
 *   ｼ / Ｂ                  → 전각·호환 문자
 *   f u c k                 → 라틴 문자 우회
 *
 * 방식: 원문을 훑으면서 (정규화 문자, 원문 인덱스) 쌍을 만든 뒤, 정규화된 문자열
 * 위에서 패턴을 찾고 매칭 구간에 해당하는 "원문 범위"를 마스킹한다. 정규화 결과를
 * 그대로 돌려주면 원문의 띄어쓰기·줄바꿈이 다 망가지기 때문에 이 구조가 필요하다.
 */

/* 한글 음절 → 초성/중성/종성 분해 */
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;

/** 겹자모를 홑자모로 편다. ㅄ → ㅂㅅ 처럼 초성 우회를 같은 평면에서 비교하기 위해. */
const CLUSTER = {
  'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ',
  'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ',
};

/** 숫자·기호로 자모를 흉내내는 흔한 치환. */
const LOOKALIKE = {
  '0': 'ㅇ', 'o': 'ㅇ', 'O': 'ㅇ',
  '1': 'ㅣ', 'l': 'ㅣ', 'I': 'ㅣ',
};

function decomposeSyllable(code) {
  const index = code - SYLLABLE_BASE;
  const cho = Math.floor(index / 588);
  const jung = Math.floor((index % 588) / 28);
  const jong = index % 28;
  return CHO[cho] + JUNG[jung] + (JONG[jong] ? CLUSTER[JONG[jong]] || JONG[jong] : '');
}

/**
 * 원문 → { text, map, standalone }
 *   text       정규화(자모 분해)된 문자열
 *   map        정규화 인덱스 → 원문 인덱스
 *   standalone 그 자모가 원문에서 이미 낱자였는지 (ㅅㅂ 처럼 초성만 쓴 경우 true).
 *              음절에서 분해되어 나온 자모는 false. "봅시다"의 ㅂ+ㅅ 처럼
 *              멀쩡한 단어 안에서 우연히 붙은 초성 조합을 걸러내는 데 쓴다.
 *
 * 정규화 규칙
 *   - NFC 정규화 후 전각을 반각으로
 *   - 공백·구두점·이모지 등 구분자는 버린다 (인덱스 매핑에서도 빠진다)
 *   - 한글 음절은 자모로 분해
 *   - 라틴 문자는 소문자로
 */
function foldFullwidth(ch) {
  const code = ch.codePointAt(0);
  // 전각 ASCII(U+FF01–U+FF5E) → 반각. Ｆ Ｕ Ｃ Ｋ 같은 우회를 잡는다.
  if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0);
  return ch;
}

function normalize(input) {
  /*
   * NFC 를 쓴다. NFKC 를 쓰면 호환 자모(ㅅ U+3145)가 조합용 자모(U+1109)로 바뀌어
   * 아래 자모 판별이 통째로 빗나간다. 전각 폴딩은 그래서 직접 한다.
   */
  const text = String(input).normalize('NFC');
  let out = '';
  const map = [];
  const standalone = [];

  for (let i = 0; i < text.length; i += 1) {
    const ch = foldFullwidth(text[i]);
    const code = ch.codePointAt(0);

    let piece = '';
    // 음절에서 분해되어 나온 자모만 false. 낱자·라틴 문자는 그 자체로 낱개다.
    let bare = true;
    if (code >= SYLLABLE_BASE && code <= SYLLABLE_LAST) {
      piece = decomposeSyllable(code);
      bare = false;
    } else if (/[ㄱ-ㅎㅏ-ㅣ]/.test(ch)) {
      piece = CLUSTER[ch] || ch;
    } else if (/[a-zA-Z]/.test(ch)) {
      piece = LOOKALIKE[ch] || ch.toLowerCase();
    } else if (/[0-9]/.test(ch)) {
      // 숫자는 자모 흉내로만 취급하고, 아니면 버린다.
      // 버려야 "시1발"의 1이 사라지면서 ㅅㅣㅂㅏㄹ 로 붙는다.
      piece = LOOKALIKE[ch] || '';
    } else {
      piece = ''; // 공백·구두점·이모지 — 구분자로 보고 제거
    }

    for (let k = 0; k < piece.length; k += 1) {
      out += piece[k];
      map.push(i);
      standalone.push(bare);
    }
  }

  return { text: out, map, standalone };
}

/*
 * 자모 평면에서 찾을 패턴.
 *
 * 넓게 잡으면 멀쩡한 말이 걸린다. 초기엔 "자모 사이 아무 모음 허용"으로 짰다가
 * "늦잠"(ㄴㅡㅈㅈㅏㅁ)이 좆 패턴에, "사방"(ㅅㅏㅂㅏㅇ)이 시발 패턴에 걸렸다.
 * 그래서 단어별로 실제 모음을 못박고, 늘려쓰기(모음 반복)와 묵음 ㅇ 삽입만 허용한다.
 *
 * 초성만 쓰는 우회(ㅅㅂ, ㅄ)는 모음 자리가 비는 것으로 자연히 커버된다.
 */

/** 항상 마스킹한다. */
const STRONG = [
  // 시발 / 씨발 / 씨팔 / 씨이발 / 시1발 / ㅅㅂ
  /[ㅅㅆ][ㅣㅡ]*(?:ㅇ[ㅣㅡ]*)*[ㅂㅃㅍ][ㅏㅐ]*ㄹ?/g,
  // 좆 / 좇 (모음 ㅗㅜ 를 반드시 요구 — 없으면 "늦잠"의 ㅈㅈ 가 걸린다)
  /[ㅈㅉ][ㅗㅜ]+[ㅈㅊ]/g,
  // 존나 / 졸라 / ㅈㄴ
  /[ㅈㅉ][ㅗ]*[ㄴㄹ][ㄴㄹ]*[ㅏ]*/g,
  // 병신 / 븅신 / ㅄ / ㅂㅅ
  /[ㅂㅃ][ㅕㅡㅑ]*ㅇ*[ㅅㅆ]/g,
  // 개새끼 / 개색기
  /ㄱㅐ*[ㅅㅆ]ㅐ*[ㄱㄲㅋ]/g,
  // 지랄
  /ㅈㅣ*ㄹㅏ*ㄹ/g,
  // 니미 / 니애미
  /ㄴㅣ*ㅇ?[ㅏㅐ]*ㅁ[ㅣㅔ]/g,
  // 영문
  /f+u+c+k+/g,
  /s+h+i+t+/g,
  /b+i+t+c+h+/g,
  /a+s+s+h+o+l+e+/g,
];

/*
 * 검출은 하되 기본 마스킹은 안 한다.
 *
 * "미친 실력", "꺼져가는" 처럼 욕이 아닌 쓰임이 흔해서, 마스킹하면 가사가 더 망가진다.
 * containsProfanity() 로 경고를 띄우는 데만 쓰고, 심사에서 지적되면 STRONG 으로 옮긴다.
 */
const MILD = [
  /ㅁㅣ*ㅊㅣㄴ/g,
  /ㄲㅓ*[ㅈㅉ]/g,
];

const PATTERNS = STRONG;

/*
 * 오탐 방어.
 *
 * 패턴이 잡았지만 실제로는 멀쩡한 말인 조각들. 정규화된 매칭 결과가 여기 있으면 넘긴다.
 * 예: "십분"·"시부모"는 ㅅㅣㅂ 까지만 잡히는데, 이건 욕이 아니다.
 */
const ALLOW = new Set([
  'ㅅㅣㅂ', // 십, 시부(모)
  'ㅅㅡㅂ', // 습(관)
]);

const HAS_VOWEL = /[ㅏ-ㅣ]/;

/** 마스킹 대상 구간을 [start, end) 로 모은다(원문 인덱스 기준). */
function findRanges(source, patterns = PATTERNS) {
  const { text, map, standalone } = normalize(source);
  if (!text) return [];

  const ranges = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      if (m[0].length === 0) {
        pattern.lastIndex += 1;
        continue;
      }
      if (ALLOW.has(m[0])) continue;

      /*
       * 모음이 하나도 없는 매칭은 초성 약어(ㅅㅂ·ㅄ·ㅈㄴ)를 노린 것이다.
       * 이때는 매칭된 자모가 전부 원문에서도 낱자였어야 한다. 아니면
       * "봅시다"(ㅂㅗ|ㅂ + ㅅㅣ…)처럼 받침과 다음 초성이 붙어 만들어진
       * 우연한 조합까지 잡아버린다.
       */
      if (!HAS_VOWEL.test(m[0])) {
        let allBare = true;
        for (let k = m.index; k < m.index + m[0].length; k += 1) {
          if (!standalone[k]) {
            allBare = false;
            break;
          }
        }
        if (!allBare) continue;
      }

      const start = map[m.index];
      const endIdx = map[m.index + m[0].length - 1];
      if (start == null || endIdx == null) continue;
      ranges.push([start, endIdx + 1]);
    }
  }

  // 겹치는 구간 병합 — 두 패턴이 같은 자리를 잡으면 마스크가 중복된다.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

const MASK = '삐-';

/** 비속어를 '삐-' 로 바꾼다. 줄바꿈·띄어쓰기 등 원문 구조는 유지된다. */
export function maskProfanity(text) {
  if (!text) return text;
  const source = String(text);
  const ranges = findRanges(source);
  if (ranges.length === 0) return source;

  let out = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    out += source.slice(cursor, start) + MASK;
    cursor = end;
  }
  return out + source.slice(cursor);
}

/**
 * 마스킹 없이 검출만. 입력 단계에서 사용자에게 경고할 때 쓴다.
 * @param {{includeMild?: boolean}} [options] MILD 목록까지 볼지 여부
 */
export function containsProfanity(text, options = {}) {
  if (!text) return false;
  const source = String(text);
  if (findRanges(source, STRONG).length > 0) return true;
  if (options.includeMild) return findRanges(source, MILD).length > 0;
  return false;
}

export function maskResult(data) {
  if (data && typeof data === 'object') {
    if (data.lyrics) data.lyrics = maskProfanity(data.lyrics);
    if (data.title) data.title = maskProfanity(data.title);
  }
  return data;
}
