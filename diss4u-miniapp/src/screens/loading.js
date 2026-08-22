/*
 * 생성 진행 화면.
 *
 * 체크리스트가 "2초 이상 지연 금지"를 걸고 있는데 노래 생성은 1~2분이 걸린다.
 * 그래서 진행 상태를 계속 갱신하는 화면이 필수다. 퍼센트·경과초·단계 문구를
 * 모두 움직여서 멈춘 것처럼 보이지 않게 한다.
 */

import { el } from '../ui/dom.js';
import { state } from '../state.js';
import { RANDOM_GENRE_POOL } from '../data.js';
import * as api from '../lib/api.js';
import * as nav from '../lib/nav.js';
import * as songs from '../lib/songs.js';
import { openChargeSheet } from '../ui/charge.js';
import { toast } from '../ui/toast.js';

const POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 5 * 60 * 1000;

/** 응답 어디에 있든 오디오 URL 을 찾아낸다. 원본 findAudioUrl 과 같은 규칙. */
function findAudioUrl(node, depth = 0) {
  if (!node || depth > 10) return null;
  if (typeof node === 'string') {
    if (/^https?:\/\/.+\.(mp3|wav|m4a|ogg|aac|flac)/i.test(node)) return node;
    if (/^https?:\/\/.*audio.*/i.test(node) && node.length > 20) return node;
    return null;
  }
  if (typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findAudioUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const key of ['audio_url', 'audioUrl', 'audio', 'mp3_url', 'mp3Url', 'url']) {
    if (key in node) {
      const found = findAudioUrl(node[key], depth + 1);
      if (found) return found;
    }
  }
  for (const value of Object.values(node)) {
    const found = findAudioUrl(value, depth + 1);
    if (found) return found;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollSong(jobId, onTick, isCancelled) {
  const startedAt = Date.now();
  while (!isCancelled()) {
    await sleep(POLL_INTERVAL_MS);
    if (isCancelled()) return null;

    const elapsed = Date.now() - startedAt;
    if (elapsed > MAX_WAIT_MS) throw new Error('생성 시간이 너무 오래 걸려요. 잠시 후 다시 시도해주세요.');
    onTick(elapsed);

    let data;
    try {
      data = await api.songStatus(jobId);
    } catch {
      continue; // 폴링 중 일시적 실패는 넘어가고 다음 주기에 다시 본다.
    }

    const status = String(data.status || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'FINISHED' || status === 'SUCCESS') {
      const audioUrl = findAudioUrl(data);
      if (!audioUrl) throw new Error('완성된 음원 주소를 찾지 못했어요.');
      return { audioUrl, timestampedLyrics: data.timestampedLyrics || null };
    }
    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error(`생성 실패: ${data.error || data.message || '알 수 없는 오류'}`);
    }
  }
  return null;
}

export function render(root) {
  const msg = el('div', { class: 'loading-msg', text: '킹받는 가사 쓰는 중… 🔥' });
  const sub = el('div', { class: 'loading-sub', text: 'AI가 약점 분석 중이에요' });
  const fill = el('div', { class: 'progress-fill' });
  const pct = el('div', { class: 'progress-pct', text: '5%' });

  const cancelBtn = el('button', { class: 'btn-secondary', type: 'button' }, ['❌ 취소']);

  root.appendChild(
    el('div', { class: 'loading-wrap' }, [
      el('div', { class: 'loading-orb', 'aria-hidden': 'true' }),
      msg,
      sub,
      el('div', { class: 'progress-track' }, [fill]),
      pct,
      el('div', {
        class: 'loading-note',
        html: '💡 보컬 노래 생성은 1~2분 정도 걸려요.<br>화면을 닫지 말아주세요!',
      }),
      el('div', { style: 'margin-top:20px' }, [cancelBtn]),
    ]),
  );

  const setProgress = (percent, title, detail) => {
    fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    pct.textContent = `${Math.round(percent)}%`;
    if (title) msg.textContent = title;
    if (detail) sub.textContent = detail;
  };

  state.generationCancelled = false;
  const isCancelled = () => state.generationCancelled;
  cancelBtn.addEventListener('click', () => {
    state.generationCancelled = true;
    nav.reset('input');
  });

  run(setProgress, isCancelled);
}

async function run(setProgress, isCancelled) {
  const f = state.form;

  let genre = f.genre;
  if (genre === 'random') {
    genre = RANDOM_GENRE_POOL[Math.floor(Math.random() * RANDOM_GENRE_POOL.length)];
  }

  try {
    setProgress(5, '킹받는 가사 쓰는 중… 🔥', 'AI가 약점 분석 중이에요');

    const lyrics = await api.generateLyrics({
      name: f.targetName.trim(),
      relationship: f.relationship.trim(),
      keywords: f.keywords.trim(),
      genre,
      lang: f.lang,
      gender: f.gender,
      mustInclude: f.mustInclude.trim(),
      useNameInLyrics: f.useNameInLyrics,
    });
    if (isCancelled()) return;

    setProgress(25, '약오름 농도 조절 중… 😏', '수위를 맞추는 중이에요');

    const submitted = await api.generateSong({
      lyrics: lyrics.lyrics,
      title: lyrics.title,
      style: lyrics.style,
      voice: f.voice,
    });
    if (isCancelled()) return;

    const jobId = submitted.jobId || submitted.job_id || submitted.id;
    if (!jobId) throw new Error('노래 생성을 시작하지 못했어요.');

    setProgress(35, '노래 굽는 중… 🎤', '보컬과 멜로디 합성 중 (1~2분)');

    const result = await pollSong(
      jobId,
      (elapsed) => {
        const percent = Math.min(35 + (elapsed / MAX_WAIT_MS) * 60, 95);
        setProgress(percent, '노래 굽는 중… 🎤', `조금만요, 명곡 나옵니다 (${Math.round(elapsed / 1000)}초)`);
      },
      isCancelled,
    );
    if (isCancelled() || !result) return;

    setProgress(100, '완성! 🎉', '드디어 나왔어요');

    const song = {
      id: null,
      title: lyrics.title,
      lyrics: lyrics.lyrics,
      name: f.targetName.trim(),
      relationship: f.relationship.trim(),
      keywords: f.keywords.trim(),
      mustInclude: f.mustInclude.trim(),
      genre,
      gender: f.gender,
      lang: f.lang,
      audioUrl: result.audioUrl,
      timestampedLyrics: result.timestampedLyrics,
      createdAt: new Date(),
    };

    const savedId = await songs.save(song);
    if (savedId) song.id = savedId;
    state.currentSong = song;

    // 잔액 갱신은 실패해도 결과 화면을 막지 않는다.
    api.fetchMe().catch(() => null);

    setTimeout(() => {
      if (!isCancelled()) nav.replace('result', { song });
    }, 500);
  } catch (e) {
    if (isCancelled()) return;
    nav.reset('input');
    if (e instanceof api.ApiError && e.needsCredits) {
      openChargeSheet();
      return;
    }
    toast(e.message || '생성 중 오류가 났어요.', 3200);
  }
}
