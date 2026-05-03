// App controller: wires logic + sprites to DOM screens.
// State is loaded from localStorage on boot, daily decay is applied,
// then screens are rendered as the user navigates.

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let state = Logic.load();
  Logic.applyDailyDecay(state);
  Logic.save(state);

  // -------- Screen routing --------
  function show(screen) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === screen));
    if (screen === 'home') renderHome();
    if (screen === 'inventory') renderInventory();
    if (screen === 'workout') startWorkout();
    if (screen === 'intro') renderIntro();
  }

  // -------- Intro (이름 정하기) --------
  function renderIntro() {
    $('#intro-name-input').value = '';
    $('#intro-error').classList.add('hidden');
    // 아기 모습으로 행복하게 보여줌
    startAnim($('#intro-canvas'), { stage: 'baby', mood: 'happy' });
    setTimeout(() => $('#intro-name-input').focus(), 50);
  }

  function confirmName() {
    const raw = $('#intro-name-input').value.trim();
    const errEl = $('#intro-error');
    if (!raw) {
      errEl.textContent = '이름을 입력해주세요';
      errEl.classList.remove('hidden');
      return;
    }
    if (raw.length > 8) {
      errEl.textContent = '이름은 최대 8자까지';
      errEl.classList.remove('hidden');
      return;
    }
    state.name = raw;
    Logic.save(state);
    toast(`반가워, ${raw}!`);
    show('home');
  }

  // -------- Toast --------
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 1600);
  }

  // -------- Character animation --------
  let frame = 0;
  let animTimer = null;
  function startAnim(canvas, opts = {}) {
    stopAnim();
    const tick = () => {
      const mood = opts.mood || Logic.moodFor(state.hp);
      const stage = opts.stage || Logic.stageFor(state.level);
      Sprites.draw(canvas, mood, stage, frame);
      frame = frame ? 0 : 1;
    };
    tick();
    animTimer = setInterval(tick, 500);
  }
  function stopAnim() {
    if (animTimer) clearInterval(animTimer);
    animTimer = null;
  }

  // -------- Home --------
  function renderHome() {
    $('#home-name').textContent = state.name || '다마고치';
    $('#home-level').textContent = state.level;
    $('#home-exp').textContent = state.exp;
    $('#home-exp-max').textContent = Logic.expForLevel(state.level);
    const pct = Math.min(100, Math.floor((state.exp / Logic.expForLevel(state.level)) * 100));
    $('#home-exp-fill').style.width = pct + '%';
    $('#home-hp').textContent = state.hp;
    $('#stage-text').textContent = Logic.stageNameKo(Logic.stageFor(state.level));

    const bar = $('#home-hp-bar');
    bar.innerHTML = '';
    for (let i = 0; i < Logic.MAX_HP; i++) {
      const cell = document.createElement('div');
      cell.className = 'hp-cell' + (i < state.hp ? '' : ' empty');
      bar.appendChild(cell);
    }

    const mood = Logic.moodFor(state.hp);
    const MOOD_LABEL = { happy: '행복', normal: '보통', tired: '피곤', sick: '아픔' };
    $('#mood-text').textContent = MOOD_LABEL[mood] || mood;
    $('#mood-text').style.color =
      mood === 'happy'  ? '#6cf06c' :
      mood === 'normal' ? '#ffd84a' :
      mood === 'tired'  ? '#a888c8' : '#ff5d6c';

    startAnim($('#char-canvas'));
  }

  // -------- Workout --------
  let workoutStartedAt = 0;
  let timerInterval = null;

  function startWorkout() {
    workoutStartedAt = Date.now();
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 250);
    $('#boost-tag').classList.toggle('hidden', !state.exp_boost_active);
    startAnim($('#workout-canvas'));
  }
  function stopWorkoutTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }
  function updateTimer() {
    const sec = Math.floor((Date.now() - workoutStartedAt) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    $('#timer').textContent = `${m}:${s}`;
  }

  // The workout is finalized in two steps now:
  //  1. endWorkout() — captures duration, shows the input form (HR/calories)
  //  2. confirmResult() — runs Logic.endWorkout with whatever the user typed
  // This way the user always gets a chance to enter Apple Watch data manually,
  // and the random reward/EXP/HP are only applied once at confirm time.
  let pendingWorkout = null;

  async function endWorkout() {
    const endedAt = Date.now();
    const durationSec = Math.floor((endedAt - workoutStartedAt) / 1000);
    stopWorkoutTimer();

    if (durationSec < 5) {
      toast('너무 짧아요 (최소 5초)');
      show('home');
      return;
    }

    // Try native health (Android Health Connect / iOS HealthKit when wrapped
    // as a native app). Used to pre-fill the inputs.
    let auto = null;
    if (Health.isNative()) {
      auto = await Health.readWorkoutData(workoutStartedAt, endedAt);
    }

    pendingWorkout = { durationSec, auto };
    showResultInput();
  }

  function showResultInput() {
    const r = pendingWorkout;
    const m = String(Math.floor(r.durationSec / 60)).padStart(2, '0');
    const s = String(r.durationSec % 60).padStart(2, '0');
    $('#r-time').textContent = `${m}:${s}`;
    $('#r-input-hr').value  = r.auto?.avgHeartRate || '';
    $('#r-input-cal').value = r.auto?.calories || '';
    $('#r-input-section').classList.remove('hidden');
    $('#r-reward-section').classList.add('hidden');
    $('#r-final-actions').style.display = 'none';
    show('result');
  }

  function confirmResult(skip) {
    if (!pendingWorkout) return;

    let health = null;
    if (!skip) {
      const hr  = parseInt($('#r-input-hr').value, 10);
      const cal = parseInt($('#r-input-cal').value, 10);
      const validHr  = Number.isFinite(hr)  && hr  >= 30 && hr  <= 230;
      const validCal = Number.isFinite(cal) && cal >  0  && cal <= 5000;
      if (validHr || validCal) {
        health = {
          avgHeartRate: validHr  ? hr  : null,
          calories:     validCal ? cal : null,
        };
      }
    }

    const result = Logic.endWorkout(state, pendingWorkout.durationSec, health);
    Logic.save(state);
    pendingWorkout = null;
    showResultRewards(result);
  }

  function showResultRewards(r) {
    $('#r-input-section').classList.add('hidden');
    $('#r-reward-section').classList.remove('hidden');
    $('#r-final-actions').style.display = '';
    showResult(r);
  }

  function cancelWorkout() {
    stopWorkoutTimer();
    show('home');
  }

  // -------- Result --------
  function showResult(r) {
    const m = String(Math.floor(r.durationSec / 60)).padStart(2, '0');
    const s = String(r.durationSec % 60).padStart(2, '0');
    $('#r-time').textContent = `${m}:${s}`;
    $('#r-exp').textContent  = `+${r.expGained}${r.boostUsed ? ' (x2)' : ''}`;
    $('#r-hp').textContent   = `+${r.hpGained}`;

    // Health data lines (only when present)
    const hrLine = $('#r-hr-line'), calLine = $('#r-cal-line'), intLine = $('#r-int-line');
    if (r.avgHeartRate) {
      hrLine.classList.remove('hidden');
      $('#r-hr').textContent = `${r.avgHeartRate} bpm`;
    } else hrLine.classList.add('hidden');
    if (r.calories) {
      calLine.classList.remove('hidden');
      $('#r-cal').textContent = `${r.calories} kcal`;
    } else calLine.classList.add('hidden');
    if (r.intensity && r.intensity !== 1.0) {
      intLine.classList.remove('hidden');
      const label = r.intensity >= 2.0 ? '고강도' : r.intensity >= 1.5 ? '중강도' : '저강도';
      $('#r-int').textContent = `${label} (×${r.intensity})`;
    } else intLine.classList.add('hidden');

    const lvlLine = $('#r-lvlup-line');
    if (r.levelsGained > 0) {
      lvlLine.classList.remove('hidden');
      $('#r-lvlup').textContent = `LV ${r.newLevel}`;
    } else {
      lvlLine.classList.add('hidden');
    }

    $('#r-reward').textContent = r.reward ? r.reward.name : '—';
    show('result');
  }

  // -------- Inventory --------
  function renderInventory() {
    const list = $('#inv-list');
    list.innerHTML = '';
    const entries = Object.entries(state.inventory).filter(([, c]) => c > 0);
    if (entries.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-msg';
      li.textContent = '아직 아이템이 없어요. 운동하고 보상을 받아보세요.';
      list.appendChild(li);
      return;
    }
    for (const [id, count] of entries) {
      const def = Logic.ITEM_DEFS[id];
      if (!def) continue;
      const li = document.createElement('li');
      li.className = 'inv-item';
      li.innerHTML = `
        <div class="inv-icon">${def.icon}</div>
        <div class="inv-info">
          <div class="name">${def.name}</div>
          <div class="desc">${def.desc}</div>
        </div>
        <div class="inv-count">x${count}</div>
        <button class="inv-use" data-item="${id}">사용</button>
      `;
      list.appendChild(li);
    }
  }

  // -------- Event delegation --------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      switch (btn.dataset.action) {
        case 'goto-workout':   show('workout'); return;
        case 'goto-inventory': show('inventory'); return;
        case 'goto-home':      show('home'); return;
        case 'end-workout':    endWorkout(); return;
        case 'cancel-workout': cancelWorkout(); return;
        case 'confirm-result': confirmResult(false); return;
        case 'skip-result':    confirmResult(true);  return;
        case 'confirm-name':   confirmName(); return;
      }
    }
    const useBtn = e.target.closest('.inv-use');
    if (useBtn) {
      const id = useBtn.dataset.item;
      const res = Logic.useItem(state, id);
      if (!res.ok) {
        const why = res.reason === 'full'   ? 'HP가 이미 가득 찼어요'
                  : res.reason === 'active' ? '이미 부스터 사용 중'
                  : res.reason === 'none'   ? '남은 수량 없음'
                  : '사용할 수 없어요';
        toast(why);
        return;
      }
      Logic.save(state);
      toast(res.effect);
      renderInventory();
    }
  });

  // -------- Boot --------
  // 이름이 없으면 인트로 화면(이름 정하기)으로, 있으면 홈으로.
  if (!state.name) {
    show('intro');
  } else {
    show('home');
  }

  // Enter 키로도 이름 확정 가능
  $('#intro-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmName();
    }
  });

  // Ask for health permissions on first launch (no-op on web).
  if (Health.isNative()) {
    document.addEventListener('deviceready', () => Health.requestPermissions(), { once: true });
    // Some Capacitor setups don't emit deviceready — try immediately too.
    Health.requestPermissions().catch(() => {});
  }

  // Pause animation when tab hidden to save battery.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnim();
    else {
      const active = $$('.screen').find(s => s.classList.contains('active'));
      if (active?.dataset.screen === 'home') startAnim($('#char-canvas'));
      else if (active?.dataset.screen === 'workout') startAnim($('#workout-canvas'));
    }
  });
})();
