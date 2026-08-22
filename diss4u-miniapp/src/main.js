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
import * as deeplink from './lib/deeplink.js';
import { openChargeSheet } from './ui/charge.js';

import * as inputScreen from './screens/input.js';
import * as loadingScreen from './screens/loading.js';
import * as resultScreen from './screens/result.js';
import * as mylistScreen from './screens/mylist.js';
import * as legalScreen from './screens/legal.js';
import * as settingsScreen from './screens/settings.js';
import * as creditsScreen from './screens/credits.js';
import * as inviteScreen from './screens/invite.js';

nav.register('input', inputScreen.render);
nav.register('loading', loadingScreen.render);
nav.register('result', resultScreen.render);
nav.register('mylist', mylistScreen.render);
nav.register('legal', legalScreen.render);
nav.register('settings', settingsScreen.render);
nav.register('credits', creditsScreen.render);
nav.register('invite', inviteScreen.render);

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

settingsBtn.addEventListener('click', () => nav.push('settings'));

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

/*
 * 초대 링크로 들어왔으면 추천인을 귀속시킨다.
 *
 * 서버가 '이미 귀속됨 / 이미 곡을 만든 유저 / 본인 코드' 를 전부 걸러 내므로
 * 클라이언트는 조건 없이 한 번 보내고 결과만 본다. 실패해도 조용히 넘긴다 —
 * 초대가 아니라 로그인이 주 목적인 흐름이라 여기서 사용자를 막을 이유가 없다.
 */
async function claimReferralIfAny() {
  const ref = deeplink.referralCode();
  if (!ref) return;
  try {
    const res = await api.claimReferral(ref);
    if (res?.ok) toast('친구 추천이 등록됐어요! 첫 곡을 만들면 친구에게 보상이 가요 🎁', 3200);
  } catch {
    /* 다음 실행에서 다시 시도된다 — initialURL 은 진입 URL 이라 유지된다. */
  }
}

async function onSignedIn() {
  await refreshCredits();
  await claimReferralIfAny();

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
