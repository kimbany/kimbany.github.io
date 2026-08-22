/*
 * 곡 신고.
 *
 * 약관 제5조(욕설·비하 표현 제한)와 제10조(신고 및 권리침해 대응)를 실제로 굴리는
 * 창구다. 심사에서도 이용자 신고 수단이 있는지를 본다.
 *
 * 서버는 로그인 없이도 받는다(공유 링크로 들어온 사람이 신고할 수 있어야 한다).
 */

import { el } from './dom.js';
import { open as openModal, close as closeModal } from './modal.js';
import { toast } from './toast.js';
import * as api from '../lib/api.js';

const REASONS = [
  '욕설·비하 표현이 심해요',
  '나 또는 특정인을 괴롭히는 내용이에요',
  '개인정보가 들어 있어요',
  '성적이거나 불쾌한 내용이에요',
  '기타',
];

export function openReportSheet(song) {
  if (!song?.id) {
    toast('아직 저장되지 않은 곡은 신고할 수 없어요.');
    return null;
  }

  let picked = null;

  const detail = el('textarea', {
    class: 'textarea',
    placeholder: '어떤 점이 문제였는지 알려주세요. (선택)',
    maxlength: '500',
  });
  detail.style.marginTop = '10px';

  const submit = el('button', { class: 'btn-primary', type: 'button' }, ['신고하기']);
  submit.disabled = true;

  const list = el('div', {});
  for (const reason of REASONS) {
    const row = el('button', { class: 'pack', type: 'button' }, [
      el('span', { class: 'pack-name', text: reason }),
    ]);
    row.addEventListener('click', () => {
      list.querySelectorAll('.pack').forEach((n) => {
        n.style.borderColor = 'var(--border)';
      });
      row.style.borderColor = 'var(--brand)';
      picked = reason;
      submit.disabled = false;
    });
    list.appendChild(row);
  }

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    submit.textContent = '접수 중…';
    const text = [picked, detail.value.trim()].filter(Boolean).join(' — ');
    try {
      await api.reportSong(song.id, text);
      closeModal();
      toast('신고가 접수됐어요. 검토 후 조치할게요.', 3000);
    } catch (e) {
      toast(e.message || '신고를 접수하지 못했어요.');
      submit.disabled = false;
      submit.textContent = '신고하기';
    }
  });

  return openModal({
    title: '이 노래를 신고할까요?',
    subtitle: '접수된 내용을 검토해 문제가 있으면 노래를 삭제하거나 이용을 제한해요.',
    body: [list, detail, el('div', { style: 'margin-top:16px' }, [submit])],
  });
}
