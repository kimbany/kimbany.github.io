/*
 * 입력 화면.
 *
 * 원본에서 뺀 것:
 *   - 구글/카카오 로그인 버튼 → 토스 로그인 하나로 대체
 *   - inappGuideModal("앱 내 브라우저에서 구글 로그인 차단" 안내) → 토스 로그인이라 불필요
 *   - 쿠팡 파트너스 배너, AdSense 슬롯 → 미니앱 밖으로 유도하는 배너는 반려 사유
 *   - 하단 인스타/틱톡/유튜브 계정 링크 → 자사 채널 유도라 반려 사유
 */

import { el } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { state, canAfford } from '../state.js';
import { GENDERS, RELATION_CHIPS, GENRES, VOICES, LANGS } from '../data.js';
import * as nav from '../lib/nav.js';
import * as auth from '../lib/auth.js';
import { openChargeSheet } from '../ui/charge.js';

function pillRow(items, selected, onPick) {
  const row = el('div', { class: 'pill-row' });
  for (const item of items) {
    const pill = el('div', {
      class: `pill${item.soon ? ' soon' : ''}${item.value === selected ? ' selected' : ''}`,
      text: item.soon ? `${item.label} (준비중)` : item.label,
    });
    if (!item.soon) {
      pill.addEventListener('click', () => {
        row.querySelectorAll('.pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
        onPick(item.value);
      });
    }
    row.appendChild(pill);
  }
  return row;
}

function field(labelText, icon, control, hint) {
  return el('div', { class: 'field' }, [
    el('div', { class: 'label' }, [el('span', { text: icon }), labelText]),
    control,
    hint ? el('div', { class: 'hint', html: hint }) : null,
  ]);
}

export function render(root) {
  const f = state.form;

  const hero = el('div', { class: 'hero' }, [
    el('div', { class: 'hero-greeting', text: '오늘은 누구를 놀려볼까요?' }),
    el('div', {
      class: 'hero-title',
      html: '친구한테<br>한 방 먹일<br>노래 만들기 <span class="hero-emoji">🎤</span>',
    }),
  ]);
  root.appendChild(hero);

  /* ===== 로그아웃 상태: 로그인 게이트 ===== */
  if (!state.user) {
    const btn = el('button', { class: 'btn-primary', type: 'button' }, ['토스로 시작하기']);
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '로그인 중…';
      try {
        await auth.login();
        // onUserChanged 가 화면을 다시 그린다.
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '토스로 시작하기';
        toast(e.message || '로그인에 실패했어요.');
      }
    });
    root.appendChild(
      el('div', { class: 'login-gate' }, [
        el('p', {
          html: '노래를 만들려면 로그인하세요.<br>토스 계정으로 바로 시작할 수 있어요.',
        }),
        btn,
      ]),
    );
    return;
  }

  /* ===== 입력 폼 ===== */
  root.appendChild(el('div', { class: 'section-title', text: '놀릴 정보 입력' }));

  const nameInput = el('input', {
    class: 'input',
    type: 'text',
    placeholder: '예: 김디스',
    maxlength: '20',
    value: f.targetName,
  });
  nameInput.addEventListener('input', () => {
    f.targetName = nameInput.value;
  });

  const useNameBox = el('input', { type: 'checkbox' });
  useNameBox.checked = f.useNameInLyrics;
  useNameBox.addEventListener('change', () => {
    f.useNameInLyrics = useNameBox.checked;
  });

  const nameField = field(
    '놀릴 사람 이름',
    '👤',
    el('div', {}, [
      nameInput,
      el('label', { class: 'checkline' }, [
        useNameBox,
        el('span', { html: '이름을 가사에도 사용 <span style="color:var(--text-dimmer)">(끄면 제목에만 사용)</span>' }),
      ]),
    ]),
  );

  const genderField = field(
    '놀릴 상대 (성별 / 종류)',
    '⚧',
    pillRow(GENDERS, f.gender, (v) => {
      f.gender = v;
    }),
  );

  const relInput = el('input', {
    class: 'input',
    type: 'text',
    placeholder: '예: 직장 팀장님(윗사람), 회사 후임, 친한 동생…',
    maxlength: '40',
    value: f.relationship,
  });
  relInput.addEventListener('input', () => {
    f.relationship = relInput.value;
  });
  const relChips = el('div', { class: 'chip-row' });
  for (const label of RELATION_CHIPS) {
    relChips.appendChild(
      el('div', {
        class: 'chip',
        text: label,
        onClick: () => {
          relInput.value = label;
          f.relationship = label;
        },
      }),
    );
  }
  const relField = field(
    '나와의 관계',
    '🔗',
    el('div', {}, [relInput, relChips]),
    '💡 윗사람/아랫사람까지 구체적으로 적으면 호칭·말투가 정확해져요',
  );

  const kwInput = el('textarea', {
    class: 'textarea',
    placeholder: '예: 머리숱 적음, 늦잠 대장, 매운거 못먹음, 길치, 폰 중독 (쉼표로 구분)',
    maxlength: '200',
  });
  kwInput.value = f.keywords;
  kwInput.addEventListener('input', () => {
    f.keywords = kwInput.value;
  });
  const kwField = field(
    '놀릴 포인트 (4개 이상 추천)',
    '📝',
    kwInput,
    '💡 포인트가 적으면 관계없는 엉뚱한 가사가 나와요. 4개 이상 적어주세요',
  );

  const mustInput = el('textarea', {
    class: 'textarea',
    placeholder: '예: 김새는 말 그만하자, 신입이 또 남탓하네 (콤마 또는 줄바꿈으로 구분)',
    maxlength: '300',
  });
  mustInput.value = f.mustInclude;
  mustInput.addEventListener('input', () => {
    f.mustInclude = mustInput.value;
  });
  const mustField = field(
    '꼭 넣고 싶은 문장 (선택)',
    '✍️',
    mustInput,
    '💡 적은 문장은 가사에 거의 그대로 들어가요. <b>콤마(,) 또는 줄바꿈</b>으로 구분하세요.',
  );

  const genreField = field(
    '장르 선택',
    '🎵',
    pillRow(GENRES, f.genre, (v) => {
      f.genre = v;
    }),
  );

  const voiceField = field(
    '노래 부르는 목소리',
    '🎤',
    pillRow(VOICES, f.voice, (v) => {
      f.voice = v;
    }),
  );

  const langToggle = el('div', { class: 'lang-toggle' });
  for (const lang of LANGS) {
    const btn = el('button', {
      type: 'button',
      class: lang.value === f.lang ? 'active' : '',
      text: lang.label,
    });
    btn.addEventListener('click', () => {
      langToggle.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      f.lang = lang.value;
    });
    langToggle.appendChild(btn);
  }
  const langField = field('가사 언어', '🌐', langToggle);

  root.appendChild(
    el('div', { class: 'card' }, [
      nameField,
      genderField,
      relField,
      kwField,
      mustField,
      genreField,
      voiceField,
      langField,
    ]),
  );

  const errorBox = el('div', {});
  root.appendChild(errorBox);

  const showError = (msg) => {
    errorBox.innerHTML = '';
    errorBox.appendChild(el('div', { class: 'error-box', text: msg }));
  };

  const submit = el('button', { class: 'btn-primary', type: 'button' }, [
    el('span', { text: '🎤' }),
    el('span', { text: '노래 만들기' }),
  ]);
  submit.addEventListener('click', () => {
    errorBox.innerHTML = '';
    if (!f.targetName.trim()) {
      showError('놀릴 사람 이름을 입력해주세요');
      return;
    }
    if (!f.keywords.trim()) {
      showError('놀릴 포인트를 입력해주세요');
      return;
    }
    if (!canAfford()) {
      openChargeSheet();
      return;
    }
    nav.push('loading');
  });
  root.appendChild(submit);

  root.appendChild(
    el('div', {
      class: 'hint',
      style: 'text-align:center;margin-top:10px',
      text: `노래 한 곡에 ${state.costPerSong}크레딧 · AI가 작사+작곡`,
    }),
  );

  root.appendChild(
    el('div', { class: 'notice' }, [
      el('div', { class: 'notice-title', text: '🙏 안전하게 즐겨주세요' }),
      el('ul', {}, [
        el('li', {
          text: '심한 표현이나 비하 내용은 지양해 주세요. 신고가 접수되면 해당 노래는 삭제될 수 있어요.',
        }),
        el('li', {
          text: '타인을 괴롭히거나 상처 주는 용도로 쓰면 안 돼요. 가볍게 웃고 즐기는 용도로만 써주세요.',
        }),
      ]),
    ]),
  );
}
