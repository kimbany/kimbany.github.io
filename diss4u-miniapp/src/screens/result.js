/*
 * 결과 화면.
 *
 * ⚠️ 인스타 영상 생성(Canvas + MediaRecorder + AudioContext)은 여기 없다.
 *    토스 웹뷰에서 canvas.captureStream() / createMediaStreamDestination() 이
 *    도는지 실기기로 확인되지 않았다. 진단 미니앱으로 확정하기 전에는 이식하지
 *    않는다는 게 인수인계 문서의 0단계 결정이다. 결과가 나오면
 *    src/screens/video.js 를 추가하고 이 화면에 버튼만 달면 된다.
 *
 * 공유 리워드(+2크레딧, 곡당 1회)는 서버 /share-reward 가 중복을 막는다.
 */

import { el } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { state } from '../state.js';
import { genreLabel, langLabel } from '../data.js';
import * as audio from '../lib/audio.js';
import * as nav from '../lib/nav.js';
import * as share from '../lib/share.js';
import * as files from '../lib/files.js';
import * as api from '../lib/api.js';

export function render(root, params) {
  const song = params.song || state.currentSong;
  if (!song) {
    nav.reset('input');
    return;
  }

  root.appendChild(
    el('div', { class: 'result-hero' }, [
      el('div', { class: 'result-label', text: '🎤 NEW SONG' }),
      el('div', { class: 'result-title', text: song.title || '제목 없음' }),
      el('div', { class: 'result-meta' }, [
        song.genre ? el('span', { class: 'meta-tag', text: genreLabel(song.genre) }) : null,
        song.lang ? el('span', { class: 'meta-tag', text: langLabel(song.lang) }) : null,
        song.name ? el('span', { class: 'meta-tag', text: `🎯 ${song.name}` }) : null,
      ]),
    ]),
  );

  if (song.audioUrl) {
    const wrap = el('div', { class: 'audio-player' });
    root.appendChild(wrap);
    audio.load(song.audioUrl);
    audio.mount(wrap);
  }

  root.appendChild(el('div', { class: 'section-title', text: '가사' }));
  root.appendChild(el('div', { class: 'lyrics-box', text: song.lyrics || '' }));

  if (song.keywords) {
    root.appendChild(el('div', { class: 'section-title', text: '🎯 놀릴 포인트' }));
    root.appendChild(el('div', { class: 'lyrics-box', text: song.keywords }));
  }
  if (song.mustInclude) {
    root.appendChild(el('div', { class: 'section-title', text: '✍️ 꼭 넣고 싶은 문장' }));
    root.appendChild(el('div', { class: 'lyrics-box', text: song.mustInclude }));
  }

  /* ===== 액션 ===== */
  const shareBtn = el('button', { class: 'btn-secondary', type: 'button' }, ['💬 공유하기']);
  shareBtn.addEventListener('click', async () => {
    const opened = await share.shareSong(song);
    if (!opened) {
      toast('이 환경에서는 공유를 지원하지 않아요.');
      return;
    }
    if (!song.id) return;
    try {
      const res = await api.claimShareReward(song.id);
      if (res?.granted) toast('공유 고마워요! +2크레딧 🎁');
    } catch {
      // 이미 받은 곡이거나 서버가 거절한 경우. 사용자에게 알릴 일은 아니다.
    }
  });

  const saveBtn = el('button', { class: 'btn-secondary', type: 'button' }, ['⬇️ MP3 저장']);
  saveBtn.addEventListener('click', async () => {
    if (!song.audioUrl) {
      toast('저장할 음원이 없어요.');
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중…';
    try {
      await files.saveFromUrl(song.audioUrl, files.safeFileName(song.title, 'mp3'), 'audio/mpeg');
      toast('기기에 저장했어요.');
    } catch (e) {
      toast(e.message || '저장하지 못했어요.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '⬇️ MP3 저장';
    }
  });

  const copyBtn = el('button', { class: 'btn-secondary', type: 'button' }, ['📋 가사 복사']);
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(song.lyrics || '');
      toast('가사를 복사했어요.');
    } catch {
      toast('복사하지 못했어요.');
    }
  });

  const newBtn = el('button', { class: 'btn-secondary', type: 'button' }, ['✨ 새 노래']);
  newBtn.addEventListener('click', () => nav.reset('input'));

  root.appendChild(el('div', { class: 'action-grid' }, [shareBtn, saveBtn, copyBtn, newBtn]));

  const listBtn = el('button', { class: 'btn-ghost', type: 'button' }, ['🎵 내가 만든 곡 보기']);
  listBtn.addEventListener('click', () => nav.push('mylist'));
  root.appendChild(listBtn);
}
