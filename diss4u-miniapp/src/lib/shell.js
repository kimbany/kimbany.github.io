/*
 * 토스 앱 셸(내비게이션 바)과의 연결.
 *
 * 앱인토스는 미니앱 위에 자체 내비게이션 바를 얹는다. 체크리스트가 이렇게 요구한다.
 *   "[좌측] 뒤로가기 버튼(<)이 모든 화면에서 정상적으로 동작해요."
 *   "토스 내비게이션 바의 뒤로가기 버튼과 미니앱에서 자체 구현한 뒤로가기 버튼이
 *    동시에 보이지 않아요."
 *   "최초 화면에서 뒤로가기를 누르면 미니앱이 종료돼요."
 *
 * 그래서 화면마다 '← 뒤로' 버튼을 넣는 대신, 토스 내비바의 뒤로가기(graniteEvent
 * backEvent)를 받아 내부 스택을 되감는다. 되감을 게 없으면 Screen.close() 로 나간다.
 *
 * 히스토리를 안 쓰기로 한 결정(lib/nav.js 주석 참고)이 여기서 값을 한다.
 * pushState 로 화면을 쌓았다면 토스 뒤로가기와 브라우저 히스토리가 각자 움직여
 * 어긋났을 것이다.
 */

import { graniteEvent, Screen } from '@apps-in-toss/web-framework';
import * as nav from './nav.js';
import { isOpen as isModalOpen, close as closeModal } from '../ui/modal.js';

export async function exit() {
  try {
    await Screen.close();
  } catch {
    // 토스 앱 밖(개발용 브라우저)에서는 닫을 화면이 없다.
  }
}

/**
 * 토스 내비바의 뒤로가기/홈 버튼을 내부 화면 스택에 연결한다.
 * @returns {() => void} 구독 해제
 */
export function connect() {
  const handlers = [];

  const onBack = () => {
    // 모달이 떠 있으면 모달부터 닫는다. 뒤로가기 한 번에 두 단계가 사라지면 안 된다.
    if (isModalOpen()) {
      closeModal();
      return;
    }
    // 스택에 되감을 게 없으면 미니앱을 종료한다.
    if (!nav.back()) exit();
  };

  const onHome = () => {
    if (isModalOpen()) closeModal();
    nav.reset('input');
  };

  try {
    handlers.push(graniteEvent.addEventListener('backEvent', { onEvent: onBack }));
    handlers.push(graniteEvent.addEventListener('homeEvent', { onEvent: onHome }));
  } catch {
    // 브리지가 없는 환경. 브라우저에서는 뒤로가기 연동이 없어도 개발에 지장 없다.
  }

  return () => {
    for (const off of handlers) {
      try {
        off?.();
      } catch {
        /* 이미 해제됨 */
      }
    }
  };
}
