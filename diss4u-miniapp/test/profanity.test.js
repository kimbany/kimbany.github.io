import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskProfanity, containsProfanity } from '../server-patch/profanity.js';

/* 걸러야 하는 것 — 원본 maskProfanity 가 놓치던 우회를 포함한다. */
const SHOULD_MASK = [
  '시발',
  '씨발',
  '씨 발',
  '씨-발',
  '씨.발',
  '시1발',
  '씨이발',
  'ㅅㅂ',
  'ㅆㅂ',
  '존나',
  'ㅈㄴ',
  '병신',
  'ㅄ',
  'ㅂㅅ',
  '개새끼',
  '지랄',
  '좆같아',
  'fuck',
  'f u c k',
  'FUCK',
  'ＦＵＣＫ',
  'shit',
  'bitch',
];

/* 건드리면 안 되는 것 — 오탐하면 가사가 망가진다. */
const SHOULD_KEEP = [
  '안녕하세요',
  '노래 만들기',
  '십분만 기다려',
  '오늘 날씨 좋다',
  '머리숱이 적어',
  // 아래는 실제로 오탐이 났던 것들 — 회귀 방지용
  '늦잠 대장',   // 받침 ㅈ + 초성 ㅈ 이 좆 패턴에 걸렸다
  '사방이 조용해', // ㅅ..ㅂ 가 시발 패턴에 걸렸다
  '봅시다',      // 받침 ㅂ + 초성 ㅅ 이 ㅂㅅ 약어로 잡혔다
  '굽신거려',
  '시부모님',
  '십분만 기다려',
  '자네 왔는가',
  '지나간 일',
  '질문 있어요',
  '밧줄',
  '개구리',
  '새끼손가락',
  '입술',
  '합숙',
  '업신여겨',
];

test('우회 표기를 포함해 비속어를 마스킹한다', () => {
  for (const sample of SHOULD_MASK) {
    assert.ok(
      containsProfanity(sample),
      `검출 실패: ${JSON.stringify(sample)}`,
    );
    assert.ok(
      maskProfanity(sample).includes('삐-'),
      `마스킹 실패: ${JSON.stringify(sample)}`,
    );
  }
});

test('평범한 문장은 건드리지 않는다', () => {
  for (const sample of SHOULD_KEEP) {
    assert.equal(
      maskProfanity(sample),
      sample,
      `오탐: ${JSON.stringify(sample)} → ${JSON.stringify(maskProfanity(sample))}`,
    );
  }
});

test('줄바꿈과 구조를 유지한다', () => {
  const input = '[Verse]\n너는 시발 늦잠 대장\n[Hook]\n오늘도 지각이야';
  const out = maskProfanity(input);
  assert.equal(out.split('\n').length, 4, '줄 수가 바뀌면 안 된다');
  assert.ok(out.startsWith('[Verse]\n'));
  assert.ok(out.includes('삐-'));
  assert.ok(out.includes('늦잠 대장'));
  assert.ok(out.endsWith('오늘도 지각이야'));
});

test('빈 값과 비문자열을 안전하게 넘긴다', () => {
  assert.equal(maskProfanity(''), '');
  assert.equal(maskProfanity(null), null);
  assert.equal(maskProfanity(undefined), undefined);
  assert.equal(containsProfanity(''), false);
});
