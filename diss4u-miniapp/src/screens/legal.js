/*
 * 약관·개인정보처리방침·환불정책 화면.
 *
 * 미니앱은 기능이 안에서 완결되어야 한다. 웹 페이지로 링크를 걸면 "미니앱 밖으로
 * 내보내는" 것이 되어 반려 사유라, 전문을 이 화면에서 렌더한다.
 */

import { el } from '../ui/dom.js';
import { LEGAL_DOCS } from '../legal/docs.js';
import * as nav from '../lib/nav.js';

export function render(root, params) {
  const doc = LEGAL_DOCS[params.doc] || LEGAL_DOCS.terms;

  const back = el('button', { class: 'back-btn', type: 'button' }, ['← 뒤로']);
  back.addEventListener('click', () => {
    if (!nav.back()) nav.reset('input');
  });
  root.appendChild(back);

  root.appendChild(
    el('div', { style: 'font-size:22px;font-weight:800;letter-spacing:-0.8px;margin-top:6px' }, [
      doc.title,
    ]),
  );
  if (doc.updated) {
    root.appendChild(el('div', { class: 'hint', text: doc.updated }));
  }

  const wrap = el('div', { style: 'margin-top:18px' });
  for (const block of doc.blocks) {
    switch (block.type) {
      case 'h2':
        wrap.appendChild(
          el('div', {
            style:
              'font-size:15px;font-weight:800;margin:22px 0 8px;color:var(--brand-strong)',
            text: block.text,
          }),
        );
        break;
      case 'p':
        wrap.appendChild(
          el('p', { style: 'font-size:14px;line-height:1.8;color:var(--text-dim)', text: block.text }),
        );
        break;
      case 'note':
        wrap.appendChild(
          el('div', {
            class: 'card',
            style: 'font-size:13px;line-height:1.8;color:var(--text-dim);margin:12px 0',
            text: block.text,
          }),
        );
        break;
      case 'list': {
        const ul = el('ul', { style: 'padding-left:18px;margin:6px 0' });
        for (const item of block.items) {
          ul.appendChild(
            el('li', {
              style: 'font-size:14px;line-height:1.8;color:var(--text-dim);margin:4px 0',
              text: item,
            }),
          );
        }
        wrap.appendChild(ul);
        break;
      }
      default:
        break;
    }
  }
  root.appendChild(wrap);
}
