/* 홈 — 대메뉴 선택 화면 */
import { escapeHtml } from './util.js';

export function renderHome(root, { menus, go }) {
  root.innerHTML = `
    <div class="card center home-hero">
      <p class="eyebrow">Party Box</p>
      <h1 class="title">무엇을 하고<br>놀까요?</h1>
      <p class="subtitle">번호가 붙은 피규어·랜덤박스를<br>재미있게 나누는 두 가지 방법</p>
    </div>

    <div class="menu-list">
      ${menus.map((m) => `
        <button class="menu-card" type="button" data-go="${m.id}" style="--accent:${m.accent}">
          <span class="menu-icon">${m.icon}</span>
          <span class="menu-body">
            <span class="menu-title">${escapeHtml(m.title)}</span>
            <span class="menu-desc">${escapeHtml(m.desc)}</span>
            ${m.status ? `<span class="menu-status">${escapeHtml(m.status)}</span>` : ''}
          </span>
          <span class="menu-arrow">›</span>
        </button>`).join('')}
    </div>

    <p class="center small muted">진행 상황은 자동으로 저장됩니다.<br>메뉴를 오가도 하던 게임은 그대로 남아 있습니다.</p>
  `;
  root.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => go(btn.dataset.go));
  });
}
