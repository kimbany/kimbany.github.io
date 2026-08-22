/* 화면 사이에 공유되는 상태. 모듈 하나에 모아 어디서 바뀌는지 추적할 수 있게 한다. */

import { COST_PER_SONG } from './config.js';

export const state = {
  user: null,

  credits: null,
  freeCredits: null,
  paidCredits: null,
  creditsEnabled: false,
  costPerSong: COST_PER_SONG,
  refCode: null,
  /** /me 의 expiringSoon. 홈 화면 배너가 읽는다. */
  expiringSoon: null,

  // 입력 화면에서 고른 값들. 화면을 떠났다 돌아와도 유지된다.
  form: {
    targetName: '',
    relationship: '',
    keywords: '',
    mustInclude: '',
    useNameInLyrics: true,
    gender: 'male',
    genre: 'yodel',
    voice: 'random',
    lang: 'ko',
  },

  currentSong: null,
  generationCancelled: false,
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  for (const fn of listeners) fn(state);
}

export function setCredits(payload) {
  state.creditsEnabled = !!payload.enabled;
  state.credits = typeof payload.credits === 'number' ? payload.credits : null;
  state.costPerSong = payload.cost || COST_PER_SONG;
  state.refCode = payload.refCode || null;
  state.expiringSoon = payload.expiringSoon || null;
  if (typeof payload.freeCredits === 'number') state.freeCredits = payload.freeCredits;
  if (typeof payload.paidCredits === 'number') state.paidCredits = payload.paidCredits;
  notify();
}

export function canAfford() {
  if (!state.creditsEnabled) return true;
  if (state.credits == null) return true;
  return state.credits >= state.costPerSong;
}
