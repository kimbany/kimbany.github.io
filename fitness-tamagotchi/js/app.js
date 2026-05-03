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
    $('#mood-text').textContent = mood.toUpperCase();
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

  function endWorkout() {
    const durationSec = Math.floor((Date.now() - workoutStartedAt) / 1000);
    stopWorkoutTimer();

    if (durationSec < 5) {
      // Too short — discard, go home.
      toast('TOO SHORT (min 5s)');
      show('home');
      return;
    }

    const result = Logic.endWorkout(state, durationSec);
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
      li.textContent = 'NO ITEMS YET. EXERCISE TO GET REWARDS.';
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
        <button class="inv-use" data-item="${id}">USE</button>
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
        const why = res.reason === 'full'   ? 'HP ALREADY FULL'
                  : res.reason === 'active' ? 'BOOST ALREADY ACTIVE'
                  : res.reason === 'none'   ? 'NONE LEFT'
                  : 'CANT USE';
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
