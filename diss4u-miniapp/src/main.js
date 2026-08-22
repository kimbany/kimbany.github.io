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
import * as songs from './lib/songs.js';
import * as shell from './lib/shell.js';

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
  if (!state.user) return null;
  try {
    const me = await api.fetchMe();
    setCredits(me);
    return me;
  } catch {
    // 콜드스타트로 Render 가 깨어나는 중일 수 있다. 잔액은 다음 기회에 채운다.
    return null;
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
  const me = await refreshCredits();
  await claimReferralIfAny();

  // 결제는 됐는데 지급이 안 끝난 주문을 복구한다.
  if (iap.isSupported()) {
    const { recovered } = await iap.restorePendingOrders();
    if (recovered > 0) {
      await refreshCredits();
      toast(`이전 결제 ${recovered}건의 크레딧을 지급했어요.`);
    }
  }

  /*
   * 소멸 임박 안내는 홈 화면 배너가 맡는다(ui/expiry.js). 여기서 바텀시트를 띄우면
   * "진입 직후 바텀시트 자동 노출" 금지에 걸린다.
   *
   * 배너는 /me 응답이 와야 그릴 수 있는데 홈은 그 전에 이미 그려져 있다.
   * 홈에 머물러 있을 때만 다시 그린다 — 입력값은 state.form 에 있어 날아가지 않는다.
   */
  if (me?.expiringSoon && nav.currentScreen() === 'input') nav.reset('input');
}

/*
 * 공유 링크(intoss://diss4u/song/{id})로 들어왔으면 그 곡을 바로 연다.
 *
 * 로그인하지 않아도 들을 수 있어야 한다 — 웹의 share.html 이 하던 역할이다.
 * 곡을 못 찾거나 보안 규칙이 막으면 조용히 홈에 머문다.
 */
async function openSharedSongIfAny() {
  const id = deeplink.songId();
  if (!id) return;
  const song = await songs.getById(id);
  if (song) nav.push('result', { song });
}

/*
 * 토스 앱에서 로그인 연결을 끊었으면 미니앱 세션도 끊는다.
 *
 * Firebase 세션은 토스 연결과 따로 살아 있어서, 연결을 끊어도 미니앱만 보면
 * 여전히 로그인 상태다. 체크리스트가 "연결을 끊으면 사용자 데이터가 남아 있지
 * 않아요" 를 요구하므로 부팅할 때 한 번 대조한다.
 *
 * 판단할 수 없을 때(구버전·브라우저)는 아무것도 하지 않는다. 애매하다고
 * 로그아웃시키면 멀쩡한 사용자를 쫓아낸다.
 */
async function dropSessionIfUnlinked() {
  if (!auth.getUser()) return;
  const linked = await auth.isLinked();
  if (linked !== false) return;
  songs.invalidateCache();
  await auth.logout();
}

async function boot() {
  await env.applySafeArea();

  nav.init(document.getElementById('screens'));
  nav.reset('input');

  // 토스 내비바의 뒤로가기/홈 버튼을 내부 화면 스택에 연결한다.
  shell.connect();

  ads.init();
  openSharedSongIfAny();

  auth.onUserChanged((user) => {
    const wasSignedIn = !!state.user;
    state.user = user;
    renderHeader();

    const onSharedSong = nav.currentScreen() === 'result';

    if (user) {
      dropSessionIfUnlinked().then(() => {
        if (auth.getUser()) onSignedIn();
      });
      // 로그인 게이트를 지우고 폼을 보여준다. 공유받은 곡을 듣는 중이면 그대로 둔다.
      if (!wasSignedIn && !onSharedSong) nav.reset('input');
    } else {
      state.credits = null;
      state.creditsEnabled = false;
      if (!onSharedSong) nav.reset('input');
    }
  });
}

boot();
