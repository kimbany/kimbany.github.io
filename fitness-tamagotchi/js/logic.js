// Pure game logic: HP, EXP, leveling, items, daily decay.
// No DOM access here — easy to reason about and test.

const Logic = (() => {
  const MAX_HP = 10;
  const BASE_EXP = 100;
  const LEVEL_GROWTH = 1.2;

  const ITEM_DEFS = {
    hp_potion:  { id: 'hp_potion',  type: 'hp',  value: 3, name: 'HP 포션',    desc: 'HP +3 회복',              icon: '+' },
    exp_booster:{ id: 'exp_booster',type: 'exp', value: 2, name: 'EXP 부스터', desc: '다음 운동 EXP x2',        icon: 'x' },
  };

  const REWARD_POOL = ['hp_potion', 'exp_booster'];

  function defaultState() {
    return {
      level: 1,
      exp: 0,
      hp: MAX_HP,
      name: null,           // 사용자가 첫 입장 시 정해줌
      last_active_date: todayKey(),
      inventory: {},        // { itemId: count }
      exp_boost_active: false,
      workouts: [],
    };
  }

  // Evolution tier based on level. 캐릭터 모양/크기를 결정.
  //   LV 1~9   → '아기' (작고 동글)
  //   LV 10~19 → '어른' (성체 사이즈)
  //   LV 20+   → '왕'   (어른 + 왕관)
  function stageFor(level) {
    if (level >= 20) return 'king';
    if (level >= 10) return 'adult';
    return 'baby';
  }
  function stageNameKo(stage) {
    return stage === 'king' ? '왕' : stage === 'adult' ? '어른' : '아기';
  }

  function todayKey(d = new Date()) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function daysBetween(aKey, bKey) {
    const a = new Date(aKey + 'T00:00:00Z').getTime();
    const b = new Date(bKey + 'T00:00:00Z').getTime();
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  // EXP needed to advance from `level` to `level+1`.
  function expForLevel(level) {
    return Math.floor(BASE_EXP * Math.pow(LEVEL_GROWTH, level - 1));
  }

  // Apply daily HP decay since last_active_date. Mutates state.
  function applyDailyDecay(state, today = todayKey()) {
    const days = daysBetween(state.last_active_date, today);
    if (days > 0) {
      state.hp = Math.max(0, state.hp - days);
      state.last_active_date = today;
    }
    return state;
  }

  // Add EXP, handle level-ups (supports multi-level).
  // Returns { levelsGained, expGained }.
  function gainExp(state, amount) {
    const before = state.level;
    state.exp += amount;
    while (state.exp >= expForLevel(state.level)) {
      state.exp -= expForLevel(state.level);
      state.level += 1;
    }
    return { levelsGained: state.level - before, expGained: amount };
  }

  function gainHp(state, amount) {
    const before = state.hp;
    state.hp = Math.min(MAX_HP, state.hp + amount);
    return state.hp - before;
  }

  // Compute rewards from a workout. Mutates state.
  // durationSec: integer seconds of exercise.
  // health (optional): { avgHeartRate, calories } from native health bridge.
  function endWorkout(state, durationSec, health = null) {
    const minutes = durationSec / 60;
    const intensity = intensityFromHeartRate(health?.avgHeartRate);
    const baseExp = Math.floor(minutes * 2 * intensity);
    const calorieBonus = health?.calories ? Math.floor(health.calories / 10) : 0;
    let expGained = baseExp + calorieBonus;
    let boostUsed = false;
    if (state.exp_boost_active && expGained > 0) {
      expGained *= 2;
      state.exp_boost_active = false;
      boostUsed = true;
    }
    const hpGained = Math.floor(minutes / 10) * 2;

    const { levelsGained } = gainExp(state, expGained);
    gainHp(state, hpGained);

    const reward = grantRandomItem(state);
    state.workouts.push({
      duration: durationSec,
      date: new Date().toISOString(),
      avgHeartRate: health?.avgHeartRate ?? null,
      calories: health?.calories ?? null,
    });
    state.last_active_date = todayKey();

    return {
      durationSec,
      expGained,
      hpGained,
      levelsGained,
      newLevel: state.level,
      reward,
      boostUsed,
      intensity,
      avgHeartRate: health?.avgHeartRate ?? null,
      calories: health?.calories ?? null,
    };
  }

  // Heart-rate based intensity multiplier.
  // Uses simple zones; defaults to 1.0 if unknown.
  function intensityFromHeartRate(hr) {
    if (!hr || hr <= 0) return 1.0;
    if (hr < 100) return 1.0;   // 저강도
    if (hr < 140) return 1.5;   // 중강도
    return 2.0;                  // 고강도
  }

  function grantRandomItem(state) {
    const id = REWARD_POOL[Math.floor(Math.random() * REWARD_POOL.length)];
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    return ITEM_DEFS[id];
  }

  // Use one item from inventory. Returns a result describing the effect.
  function useItem(state, itemId) {
    const count = state.inventory[itemId] || 0;
    if (count <= 0) return { ok: false, reason: 'none' };
    const def = ITEM_DEFS[itemId];
    if (!def) return { ok: false, reason: 'unknown' };

    let effect = '';
    if (def.type === 'hp') {
      const restored = gainHp(state, def.value);
      if (restored === 0) return { ok: false, reason: 'full' };
      effect = `HP +${restored}`;
    } else if (def.type === 'exp') {
      if (state.exp_boost_active) return { ok: false, reason: 'active' };
      state.exp_boost_active = true;
      effect = '다음 운동 EXP x2';
    }
    state.inventory[itemId] = count - 1;
    return { ok: true, effect, def };
  }

  function moodFor(hp) {
    if (hp >= 8) return 'happy';
    if (hp >= 4) return 'normal';
    if (hp >= 2) return 'tired';
    return 'sick';
  }

  // ---- Persistence ----
  const KEY = 'fitness-tamagotchi:v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Merge with defaults to be forward-compatible.
      return Object.assign(defaultState(), parsed);
    } catch (_) {
      return defaultState();
    }
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  function reset() {
    localStorage.removeItem(KEY);
  }

  return {
    MAX_HP, BASE_EXP, ITEM_DEFS, REWARD_POOL,
    defaultState, todayKey, daysBetween,
    expForLevel, applyDailyDecay, gainExp, gainHp,
    endWorkout, intensityFromHeartRate, grantRandomItem, useItem, moodFor,
    stageFor, stageNameKo,
    load, save, reset,
  };
})();
