/*
 * 전역 오디오 컨트롤러.
 *
 * 심사 체크리스트가 음악 앱을 겨냥해 세 가지를 요구한다.
 *   - "인앱 결제를 진행할 때, 미니앱에서 재생 중인 음악은 일시 정지돼요."
 *   - "토스페이 간편 결제를 진행할 때, 미니앱에서 재생 중인 음악은 일시 정지돼요."
 *   - "인앱 광고가 재생될 때, 미니앱에서 재생 중인 음악은 일시 정지돼요."
 *
 * 원본 diss4u 는 showScreen() 안에서 "결과 화면을 벗어날 때만" 정지시켰다.
 * 결제 모달은 결과 화면에 머문 채 열리기 때문에 노래가 계속 흘렀다.
 *
 * 그래서 재생을 이 모듈 하나로 모으고, 결제·광고처럼 음악을 멈춰야 하는 구간은
 * suspend() 가 돌려주는 해제 함수로 감싸게 했다. 중첩(광고 위에 결제)될 수 있으니
 * 참조 카운트로 세고, 마지막 하나가 풀릴 때만 원래 재생 중이었던 경우에 한해 재개한다.
 */

let el = null;
let suspendCount = 0;
let resumeOnRelease = false;

function element() {
  if (el) return el;
  el = document.createElement('audio');
  el.preload = 'none';
  el.controls = true;
  return el;
}

/** <audio> 엘리먼트를 컨테이너에 붙인다. 엘리먼트는 화면이 바뀌어도 하나로 유지된다. */
export function mount(container) {
  const node = element();
  if (node.parentNode !== container) container.appendChild(node);
  return node;
}

export function load(src) {
  const node = element();
  if (node.src !== src) {
    node.src = src;
    node.preload = 'metadata';
  }
}

export function pause() {
  if (el && !el.paused) el.pause();
}

/** 재생 중이면 멈추고, 다음 load() 까지 소스를 비운다. 화면 이탈용. */
export function stop() {
  if (!el) return;
  el.pause();
  try {
    el.currentTime = 0;
  } catch {
    /* 메타데이터 전이면 seek 이 던진다. 무시해도 되는 경우다. */
  }
}

export function isPlaying() {
  return !!el && !el.paused && !el.ended;
}

/**
 * 음악을 멈춰야 하는 구간을 연다. 반환된 함수를 호출하면 구간이 닫히고,
 * 구간에 들어갈 때 재생 중이었다면 재개한다.
 *
 * 반환 함수는 여러 번 불러도 한 번만 동작한다 — 광고 SDK 가 dismissed 와
 * failedToShow 를 둘 다 쏘는 경우가 있어서 방어해 둔다.
 */
export function suspend() {
  if (suspendCount === 0) {
    resumeOnRelease = isPlaying();
    pause();
  }
  suspendCount += 1;

  let released = false;
  return function release() {
    if (released) return;
    released = true;
    suspendCount = Math.max(0, suspendCount - 1);
    if (suspendCount > 0) return;
    if (!resumeOnRelease) return;
    resumeOnRelease = false;
    // 광고·결제 화면에서 돌아온 직후라 자동재생이 거절될 수 있다. 조용히 넘긴다.
    const p = el && el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
}

/** 진행 중인 suspend 가 있는지. 테스트와 진단용. */
export function isSuspended() {
  return suspendCount > 0;
}

/**
 * 결제·광고처럼 음악을 멈춰야 하는 비동기 작업을 감싼다.
 * fn 이 던지든 말든 구간은 반드시 닫힌다.
 */
export async function withMusicPaused(fn) {
  const release = suspend();
  try {
    return await fn();
  } finally {
    release();
  }
}
