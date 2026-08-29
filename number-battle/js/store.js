/* 상태 저장소 — localStorage 영속화 + 구독
 *
 * 비밀 선택 내용(originalNumber)이나 가챠에 남은 숫자가 저장소에 그대로 보이면
 * 김이 새므로 가볍게 인코딩해서 저장한다. (암호화가 아니라 "실수로 엿보기" 방지용)
 *
 * 번호 쟁탈전과 가챠가 각각 다른 키를 쓰므로 createStore 로 키를 주입한다.
 */
import { STATE_VERSION, emptySetupState, checkIntegrity } from './engine.js';

const BATTLE_KEY = 'numberBattle.state.v1';
const MAGIC = 'NB1:';

function encode(json) {
  try {
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b ^ 0x5a);
    return MAGIC + btoa(bin);
  } catch {
    return json;
  }
}

function decode(raw) {
  if (!raw.startsWith(MAGIC)) return raw; // 예전 평문 포맷 호환
  const bin = atob(raw.slice(MAGIC.length));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i) ^ 0x5a;
  return new TextDecoder().decode(bytes);
}

/**
 * @param {string} options.key       localStorage 키
 * @param {function} options.empty   초기(빈) 상태를 만드는 함수
 * @param {function} options.validate 불러온 데이터 검증 — 문제 목록을 반환하면 그 데이터는 버린다
 * @param {number} options.version   저장 포맷 버전. 다르면 옛 데이터를 버린다
 */
export function createStore({
  key = BATTLE_KEY,
  empty = emptySetupState,
  validate = (s) => checkIntegrity(s, { final: false }),
  version = STATE_VERSION,
} = {}) {
  let state = load(key, validate, version) || empty();
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  return {
    get() { return state; },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** 상태를 바꾸는 유일한 통로. mutator 안에서 예외가 나면 상태를 되돌린다. */
    update(mutator, { silent = false } = {}) {
      const backup = JSON.stringify(state);
      try {
        const next = mutator(state);
        if (next) state = next;
      } catch (err) {
        state = JSON.parse(backup); // 반쯤 바뀐 상태가 남지 않도록 롤백
        throw err;
      }
      save(state, key);
      if (!silent) notify();
      return state;
    },

    replace(next) {
      state = next;
      save(state, key);
      notify();
      return state;
    },

    reset() {
      state = empty();
      try { localStorage.removeItem(key); } catch { /* 무시 */ }
      notify();
      return state;
    },

    /** 화면 갱신만 필요할 때 */
    touch() { notify(); },
  };
}

export function save(state, key = BATTLE_KEY) {
  try {
    localStorage.setItem(key, encode(JSON.stringify(state)));
    return true;
  } catch {
    return false; // 시크릿 모드 등 — 저장 실패해도 게임은 계속된다
  }
}

export function load(key = BATTLE_KEY, validate = (s) => checkIntegrity(s, { final: false }), version = STATE_VERSION) {
  let raw = null;
  try { raw = localStorage.getItem(key); } catch { return null; }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decode(raw));
    if (!parsed || parsed.version !== version) return null;
    // 저장된 데이터가 깨졌으면 버린다 (설정 단계 상태는 검사할 게 없다)
    if (parsed.phase && parsed.phase !== 'SETUP' && validate(parsed).length) return null;
    return parsed;
  } catch {
    return null;
  }
}
