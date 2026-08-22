/*
 * 미니앱 진입점.
 *
 * 순서가 중요한 것 두 가지.
 *   - safe area 는 첫 렌더 전에 심어야 헤더가 노치 아래로 안 밀린다.
 *   - 미지급 주문 복구(getPendingOrders)는 로그인 직후에 돌려야 한다. 서버가
 *     크레딧을 적립하려면 Firebase ID 토큰이 필요하기 때문.
 */

import './styles/theme.css';
import './styles/base.css';
import './styles/components.css';

import * as nav from './lib/nav.js';
import * as env from './lib/env.js';
import * as auth from './lib/auth.js';
import * as api from './lib/api.js';
import * as iap from './lib/iap.js';
import * as ads from './lib/ads.js';
import { state, setCredits, subscribe } from './state.js';
import { toast } from './ui/toast.js';
import { openChargeSheet } from './ui/charge.js';
import { open as openModal, close as closeModal } from './ui/modal.js';
import { el } from './ui/dom.js';

import * as inputScreen from './screens/input.js';
import * as loadingScreen from './screens/loading.js';
import * as resultScreen from './screens/result.js';
import * as mylistScreen from './screens/mylist.js';
import * as legalScreen from './screens/legal.js';

nav.register('input', inputScreen.render);
nav.register('loading', loadingScreen.render);
nav.register('result', resultScreen.render);
nav.register('mylist', mylistScreen.render);
nav.register('legal', legalScreen.render);

const creditChip = document.getElementById('creditChip');
const creditText = document.getElementById('creditText');
const settingsBtn = document.getElementById('settingsBtn');

function renderHeader() {
  const signedIn = !!state.user;
  creditChip.hidden = !signedIn || !state.creditsEnabled;
  settingsBtn.hidden = !signedIn;
  if (!creditChip.hidden) {
    creditText.textContent = state.credits == null ? '-' : `${state.credits}`;
  }
}

creditChip.addEventListener('click', () => openChargeSheet());

settingsBtn.addEventListener('click', () => {
  const cancel = el('button', { class: 'btn-secondary', type: 'button' }, ['취소']);
  cancel.addEventListener('click', () => closeModal());

  const confirm = el('button', { class: 'btn-secondary btn-danger', type: 'button' }, ['로그아웃']);
  confirm.addEventListener('click', async () => {
    confirm.disabled = true;
    await auth.logout();
    closeModal();
    toast('로그아웃했어요.');
  });

  openModal({
    title: '설정',
    subtitle: '로그아웃하면 만든 곡은 다시 로그인할 때 그대로 보여요.',
    body: [el('div', { class: 'modal-actions' }, [cancel, confirm])],
  });
});

for (const btn of document.querySelectorAll('[data-legal]')) {
  btn.addEventListener('click', () => nav.push('legal', { doc: btn.dataset.legal }));
}

subscribe(renderHeader);

async function refreshCredits() {
  if (!state.user) return;
  try {
    setCredits(await api.fetchMe());
  } catch {
    // 콜드스타트로 Render 가 깨어나는 중일 수 있다. 잔액은 다음 기회에 채운다.
  }
}

async function onSignedIn() {
  await refreshCredits();

  // 결제는 됐는데 지급이 안 끝난 주문을 복구한다.
  if (iap.isSupported()) {
    const { recovered } = await iap.restorePendingOrders();
    if (recovered > 0) {
      await refreshCredits();
      toast(`이전 결제 ${recovered}건의 크레딧을 지급했어요.`);
    }
  }
}

async function boot() {
  await env.applySafeArea();

  nav.init(document.getElementById('screens'));
  nav.reset('input');

  ads.init();

  auth.onUserChanged((user) => {
    const wasSignedIn = !!state.user;
    state.user = user;
    renderHeader();

    if (user) {
      onSignedIn();
      // 로그인 게이트를 지우고 폼을 보여준다.
      if (!wasSignedIn) nav.reset('input');
    } else {
      state.credits = null;
      state.creditsEnabled = false;
      nav.reset('input');
    }
  });
}

boot();
