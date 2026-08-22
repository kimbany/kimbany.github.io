/*
 * 가사 표시.
 *
 * kie 가 곡을 만들 때 단어별 타임스탬프를 같이 준다. 웹은 이 데이터를 영상 렌더링
 * (canvas)에만 썼고 화면에는 평문 가사만 띄웠다. 미니앱은 카테고리가 '음악·오디오'라
 * 재생 화면이 곧 앱의 얼굴이어서, 같은 데이터로 노래방식 싱크를 붙였다.
 *
 * 데이터 모양 (proxy/kie-music.js)
 *   { words: [{word,start,end,lead,br}],
 *     lines: [{text,start,end,words:[...]}],
 *     confidence }
 *
 * 타임스탬프가 없는 곡(옛 곡)도 많으므로 평문 렌더로 자연히 떨어져야 한다.
 */

import { el } from './dom.js';
import * as audio from '../lib/audio.js';

/** 평문 가사. 타임스탬프가 없을 때. */
function plain(text) {
  return el('div', { class: 'lyrics-box', text: text || '' });
}

/**
 * 싱크 가사.
 * @returns {{node: HTMLElement, dispose: () => void}}
 */
function synced(lines) {
  const box = el('div', { class: 'lyrics-box lyrics-synced' });
  const rows = [];

  lines.forEach((line, index) => {
    const row = el('div', { class: 'lyric-line', dataset: { index: String(index) } });

    // 단어 단위 하이라이트가 가능하면 단어로 쪼개고, 아니면 줄 텍스트만 쓴다.
    const words = Array.isArray(line.words) && line.words.length ? line.words : null;
    if (words) {
      words.forEach((w, j) => {
        if (j > 0) row.appendChild(document.createTextNode(' '));
        row.appendChild(el('span', { class: 'lyric-word', text: w.word }));
      });
    } else {
      row.textContent = line.text || '';
    }

    // 줄을 누르면 그 지점부터 듣는다.
    if (typeof line.start === 'number') {
      row.addEventListener('click', () => audio.seek(line.start));
      row.style.cursor = 'pointer';
    }

    box.appendChild(row);
    rows.push({ row, line, words: words ? [...row.querySelectorAll('.lyric-word')] : [] });
  });

  let activeIndex = -1;

  const paint = (t) => {
    // 현재 시각이 지난 마지막 줄이 활성 줄이다.
    let next = -1;
    for (let k = 0; k < lines.length; k += 1) {
      if (typeof lines[k].start === 'number' && lines[k].start <= t) next = k;
      else break;
    }

    if (next !== activeIndex) {
      const previous = rows[activeIndex];
      if (previous) {
        previous.row.classList.remove('active');
        // 지나간 줄의 단어 표시를 지운다. 안 지우면 이전 줄에 하이라이트가 남아
        // 화면에 두 줄이 동시에 켜진 것처럼 보인다.
        for (const node of previous.words) node.classList.remove('on', 'done');
      }
      activeIndex = next;
      const current = rows[activeIndex];
      if (current) {
        current.row.classList.add('active');
        // 활성 줄을 가사 상자 안에서만 스크롤한다. 페이지 전체가 튀면 안 된다.
        const top = current.row.offsetTop - box.clientHeight / 2 + current.row.clientHeight / 2;
        box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    const current = rows[activeIndex];
    if (!current || !current.words.length) return;

    const ws = current.line.words;
    current.words.forEach((node, j) => {
      const w = ws[j];
      if (!w) return;
      const end = Math.max(w.end, w.start + 0.12);
      const nextWord = ws[j + 1];
      const cut = nextWord ? Math.min(end, nextWord.start - (nextWord.lead || 0.1)) : end;
      const on = t >= w.start - (w.lead || 0.1) && t <= cut;
      const done = t > cut;
      node.classList.toggle('on', on);
      node.classList.toggle('done', !on && done);
    });
  };

  const unsubscribe = audio.subscribeTime(paint);

  return { node: box, dispose: unsubscribe };
}

/**
 * 곡에 맞는 가사 뷰를 만든다.
 * dispose 는 화면을 떠날 때 반드시 불러야 rAF 구독이 남지 않는다.
 *
 * @returns {{node: HTMLElement, dispose: () => void}}
 */
export function create(song) {
  const stamped = song?.timestampedLyrics;
  const lines = stamped?.lines;

  if (!song?.audioUrl || !Array.isArray(lines) || lines.length === 0) {
    return { node: plain(song?.lyrics), dispose: () => {} };
  }
  return synced(lines);
}
