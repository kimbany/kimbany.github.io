/* 셸 + 라우터
 *
 * 대메뉴: 홈 / 번호 쟁탈전 / 가챠 뽑기
 * 각 메뉴는 mount(shell) · unmount() 를 가진 모듈이고, 동시에 하나만 떠 있는다.
 * 주소의 해시(#battle, #gacha)로 현재 위치를 유지해 새로고침·뒤로가기가 자연스럽게 동작한다.
 */
import { renderHome } from './home.js';
import * as battle from './app.js';
import * as gacha from './gacha/app.js';

const root = document.getElementById('screen');
const chip = document.getElementById('phase-chip');
const hostBtn = document.getElementById('host-btn');
const homeBtn = document.getElementById('home-btn');
const brand = document.getElementById('brand');

const MENUS = [
  {
    id: 'battle',
    title: '번호 쟁탈전',
    desc: '번호를 몰래 고르고, 겹치면 미니게임으로 쟁탈',
    icon: '🎯',
    accent: '#ff2e88',
    module: battle,
    status: () => battle.battleStatusLine(),
  },
  {
    id: 'gacha',
    title: '가챠 뽑기',
    desc: '캡슐을 돌려 숫자를 하나씩. 중복 없이 공평하게',
    icon: '🎰',
    accent: '#22e6ff',
    module: gacha,
    status: () => gacha.gachaStatusLine(),
  },
];

const shell = {
  root,
  setChip(text, live = true) {
    chip.textContent = text || '';
    chip.hidden = !text;
    chip.classList.toggle('live', Boolean(live));
  },
  setHostMenu(handler) {
    hostBtn.onclick = handler || null;
    hostBtn.hidden = !handler;
  },
};

let current = null; // { id, module }

function unmountCurrent() {
  if (!current) return;
  try { current.module.unmount(); } catch (err) { console.error(err); }
  current = null;
}

function routeIdFromHash() {
  const id = (location.hash || '').replace(/^#\/?/, '');
  return MENUS.some((m) => m.id === id) ? id : 'home';
}

function go(id) {
  const next = id === 'home' ? '' : `#${id}`;
  if (location.hash === next || (!location.hash && !next)) render();
  else location.hash = next;
}

function render() {
  const id = routeIdFromHash();
  if (current && current.id === id) return;
  unmountCurrent();

  // 화면 전환 시 남아있을 수 있는 오버레이 정리
  document.getElementById('overlay-root').innerHTML = '';
  window.scrollTo(0, 0);

  if (id === 'home') {
    homeBtn.hidden = true;
    brand.textContent = '파티 박스';
    shell.setChip('', false);
    shell.setHostMenu(null);
    current = { id: 'home', module: { unmount() { root.innerHTML = ''; } } };
    renderHome(root, {
      go,
      menus: MENUS.map((m) => ({ ...m, status: m.status() })),
    });
    return;
  }

  const menu = MENUS.find((m) => m.id === id);
  homeBtn.hidden = false;
  brand.textContent = menu.title;
  current = { id, module: menu.module };
  menu.module.mount(shell);
}

homeBtn.addEventListener('click', () => go('home'));
window.addEventListener('hashchange', render);
render();
