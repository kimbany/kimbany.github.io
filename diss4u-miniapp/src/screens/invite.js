/*
 * 친구 초대.
 *
 * 웹은 diss4u.com/?ref=CODE 링크를 클립보드에 복사하게 했다. 미니앱은 밖으로 나가는
 * 링크를 못 쓰므로 Share.createLink 로 intoss:// 딥링크를 만들어 공유 시트로 보낸다.
 *
 * 토스가 주는 연락처 초대(Promotion.openContactsInvite)도 있는데, 콘솔에서 공유 리워드
 * moduleId 를 만들어야 쓸 수 있다. 아직 안 만들었으므로 지원 여부만 확인해 두고
 * 실제로는 일반 공유로 동작한다. moduleId 가 생기면 config 에 넣고 이 화면만 고치면 된다.
 */

import { el } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { state } from '../state.js';
import * as nav from '../lib/nav.js';
import * as share from '../lib/share.js';
import { Clipboard } from '@apps-in-toss/web-framework';

function inviteMessage(link) {
  const lines = [
    '친놀송으로 친구 놀리는 노래 만들어봤는데 진짜 웃겨 ㅋㅋ',
    '이 링크로 시작하면 나도 너도 크레딧 받아!',
  ];
  if (link) lines.push(link);
  return lines.join('\n');
}

async function copy(text) {
  /*
   * 토스 Clipboard 를 먼저 쓰고, 브리지가 없거나 권한이 없으면 웹 클립보드로 떨어진다.
   * setText 는 문자열을 그대로 받는다(객체가 아니다).
   * PermissionFunctionWithDialog 라 권한 거부 시 throw 하므로 아래 폴백이 받는다.
   */
  try {
    if (typeof Clipboard?.setText === 'function') {
      await Clipboard.setText(text);
      return true;
    }
  } catch {
    /* 아래 웹 클립보드로 */
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function render(root) {
  const back = el('button', { class: 'back-btn', type: 'button' }, ['← 뒤로']);
  back.addEventListener('click', () => {
    if (!nav.back()) nav.reset('input');
  });
  root.appendChild(back);
  root.appendChild(el('div', { class: 'section-title', text: '👯 친구 초대' }));

  const code = state.refCode;

  root.appendChild(
    el('div', { class: 'card' }, [
      el('div', {
        style: 'font-size:17px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px',
        text: '친구가 첫 곡을 만들면 +10크레딧',
      }),
      el('div', {
        class: 'hint',
        text: '초대받은 친구도 가입 보너스 20크레딧(2곡)을 받아요. 보상은 친구가 첫 곡을 완성한 뒤에 지급돼요.',
      }),
    ]),
  );

  if (!code) {
    root.appendChild(
      el('div', {
        class: 'empty',
        html: '초대 코드를 불러오지 못했어요.<br>잠시 후 다시 시도해주세요.',
      }),
    );
    return;
  }

  root.appendChild(el('div', { class: 'section-title', text: '내 초대 코드' }));
  const codeBox = el('div', {
    class: 'card',
    style:
      'text-align:center;font-size:24px;font-weight:800;letter-spacing:4px;font-variant-numeric:tabular-nums',
    text: code,
  });
  codeBox.addEventListener('click', async () => {
    if (await copy(code)) toast('초대 코드를 복사했어요.');
  });
  root.appendChild(codeBox);

  const shareBtn = el('button', { class: 'btn-primary', type: 'button' }, [
    el('span', { text: '💬' }),
    el('span', { text: '초대 링크 공유하기' }),
  ]);
  shareBtn.style.marginTop = '14px';
  shareBtn.addEventListener('click', async () => {
    shareBtn.disabled = true;
    try {
      const link = await share.inviteLink(code);
      const opened = await share.sendMessage(inviteMessage(link));
      if (opened) return;

      // 공유 시트를 못 열면(브라우저 등) 복사로 대체한다.
      if (await copy(inviteMessage(link))) toast('초대 문구를 복사했어요.');
      else toast('이 환경에서는 공유를 지원하지 않아요.');
    } finally {
      shareBtn.disabled = false;
    }
  });
  root.appendChild(shareBtn);

  root.appendChild(
    el('div', {
      class: 'hint',
      style: 'text-align:center',
      text: '만든 곡을 공유하면 곡당 +2크레딧도 받을 수 있어요.',
    }),
  );
}
