/* 내가 만든 곡 목록. Firestore songs 컬렉션을 uid 로 조회한다. */

import { el } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { genreLabel } from '../data.js';
import * as nav from '../lib/nav.js';
import * as songs from '../lib/songs.js';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(value);
  } catch {
    return '';
  }
}

export function render(root) {
  const back = el('button', { class: 'back-btn', type: 'button' }, ['← 뒤로']);
  back.addEventListener('click', () => {
    if (!nav.back()) nav.reset('input');
  });
  root.appendChild(back);
  root.appendChild(el('div', { class: 'section-title', text: '🎵 내가 만든 곡' }));

  const list = el('div', { class: 'history-list' });
  root.appendChild(list);
  list.appendChild(el('div', { class: 'empty', text: '불러오는 중…' }));

  songs
    .listMine()
    .then((rows) => {
      list.innerHTML = '';
      if (rows.length === 0) {
        list.appendChild(
          el('div', { class: 'empty', html: '아직 만든 곡이 없어요.<br>첫 곡을 만들어보세요!' }),
        );
        return;
      }
      for (const song of rows) {
        const meta = [genreLabel(song.genre), song.name && `🎯 ${song.name}`, formatDate(song.createdAt)]
          .filter(Boolean)
          .join(' · ');
        const item = el('div', { class: 'history-item' }, [
          el('div', { class: 'history-title', text: song.title || '제목 없음' }),
          el('div', { class: 'history-meta', text: meta }),
        ]);
        item.addEventListener('click', () => nav.push('result', { song }));
        list.appendChild(item);
      }
    })
    .catch(() => {
      list.innerHTML = '';
      list.appendChild(el('div', { class: 'empty', text: '목록을 불러오지 못했어요.' }));
      toast('목록을 불러오지 못했어요.');
    });
}
