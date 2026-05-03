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
  function startAnim(canvas) {
    stopAnim();
    const tick = () => {
      const mood = Logic.moodFor(state.hp);
      Sprites.draw(canvas, mood, frame);
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
    $('#home-level').textContent = state.level;
    $('#home-exp').textContent = state.exp;
    $('#home-exp-max').textContent = Logic.expForLevel(state.level);
    const pct = Math.min(100, Math.floor((state.exp / Logic.expForLevel(state.level)) * 100));
    $('#home-exp-fill').style.width = pct + '%';
    $('#home-hp').textContent = state.hp;

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

  async function endWorkout() {
    const endedAt = Date.now();
    const durationSec = Math.floor((endedAt - workoutStartedAt) / 1000);
    stopWorkoutTimer();

    if (durationSec < 5) {
      // Too short — discard, go home.
      toast('너무 짧아요 (최소 5초)');
      show('home');
      return;
    }

    // Read native health data if available (no-op on web).
    let health = null;
    if (Health.isNative()) {
      health = await Health.readWorkoutData(workoutStartedAt, endedAt);
    }

    const result = Logic.endWorkout(state, durationSec, health);
    Logic.save(state);
    showResult(result);
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
  show('home');

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
