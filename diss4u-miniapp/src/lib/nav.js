/*
 * 화면 스택.
 *
 * 원본은 history.pushState({screen}) 로 화면을 넘겼다. 체크리스트 조문은
 * "브라우저 히스토리를 조작해서 자사 사이트로 이동시키는 방식은 사용할 수 없어요"
 * 라서 내부 화면 전환 자체를 금지하진 않는다. 그래도 히스토리를 안 쓰기로 했다.
 * 웹뷰 안에서 뒤로가기 스택이 미니앱 바깥(토스 앱)과 얽히면 디버깅이 어렵고,
 * 화면 하나 넘길 때마다 히스토리가 쌓여 뒤로가기를 여러 번 눌러야 나가는 문제도 있다.
 *
 * 대신 스택을 직접 들고, 화면이 바뀔 때마다 오디오·모달 정리를 한 곳에서 한다.
 */

import * as audio from './audio.js';

const routes = new Map();
const stack = [];
let mountEl = null;
let current = null;
let disposeCurrent = null;

/**
 * 화면을 등록한다.
 *
 * render 가 함수를 돌려주면 그 화면을 떠날 때 호출한다. 싱크 가사처럼 rAF 나
 * 이벤트를 구독하는 화면은 여기서 풀어야 다음 화면까지 계속 돌아가지 않는다.
 */
export function register(name, render) {
  routes.set(name, render);
}

export function init(container) {
  mountEl = container;
}

function paint(name, params) {
  const render = routes.get(name);
  if (!render) throw new Error(`등록되지 않은 화면: ${name}`);

  // 이전 화면이 잡고 있던 구독을 먼저 푼다.
  if (disposeCurrent) {
    try {
      disposeCurrent();
    } catch {
      // 정리 실패가 화면 전환을 막으면 안 된다.
    }
    disposeCurrent = null;
  }

  // 결과 화면을 벗어나면 재생을 멈춘다. 원본과 같은 규칙인데,
  // 오디오 엘리먼트가 화면 밖에 살아 있으므로 여기서 명시적으로 끊어야 한다.
  if (current === 'result' && name !== 'result') audio.stop();

  mountEl.innerHTML = '';
  current = name;
  const dispose = render(mountEl, params || {});
  disposeCurrent = typeof dispose === 'function' ? dispose : null;
  window.scrollTo(0, 0);
}

/** 새 화면을 스택에 쌓는다. */
export function push(name, params) {
  stack.push({ name, params });
  paint(name, params);
}

/** 스택을 비우고 해당 화면 하나만 남긴다. 홈으로 돌아갈 때 쓴다. */
export function reset(name, params) {
  stack.length = 0;
  stack.push({ name, params });
  paint(name, params);
}

/** 현재 화면을 교체한다. 스택 깊이는 그대로. 로딩→결과 전이에 쓴다. */
export function replace(name, params) {
  if (stack.length === 0) stack.push({ name, params });
  else stack[stack.length - 1] = { name, params };
  paint(name, params);
}

/** 한 칸 뒤로. 더 뒤가 없으면 false 를 돌려준다(호출부가 미니앱 종료를 결정). */
export function back() {
  if (stack.length <= 1) return false;
  stack.pop();
  const top = stack[stack.length - 1];
  paint(top.name, top.params);
  return true;
}

export function currentScreen() {
  return current;
}

export function depth() {
  return stack.length;
}
