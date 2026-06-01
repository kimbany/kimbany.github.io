/* ==========================================================
   Taste OS — Generative Ambient Sound Engine
   Emotional air, not interface audio. No audio files —
   everything is synthesized live with the Web Audio API,
   so it works offline / on GitHub Pages.

   Usage:
     TasteAmbient.start('report');   // must be after a user gesture
     TasteAmbient.setWarmth(0.8);    // 0 (cool) .. 1 (warm)
     TasteAmbient.chime();           // a soft emotional tone
     TasteAmbient.setPreset('home'); // crossfade to another atmosphere
     TasteAmbient.stop();            // gentle fade-out

   Signal flow:
     drone chord (3-4 detuned osc) ┐
                                   ├─▶ lowpass(LFO) ─▶ master gain(LFO) ─▶ reverb ─▶ out
     air (filtered noise)          ┘
     soft chimes (scheduled) ──────────────────────────────────▲
   ========================================================== */

(function (global) {
  'use strict';

  // ---- musical helper: midi-ish ratios from a root (Hz) ----
  // Soft, warm chords using near-just intervals.
  const PRESETS = {
    onboarding: { root: 110.0, chord: [1, 1.5, 2, 3],          warmth: 0.45, cutoff: 620,  air: 0.018, chimeEvery: 34 },
    analysis:   { root: 98.0,  chord: [1, 1.2, 1.5, 2.4],      warmth: 0.40, cutoff: 540,  air: 0.024, chimeEvery: 22 },
    report:     { root: 130.81,chord: [1, 1.25, 1.5, 2],       warmth: 0.85, cutoff: 880,  air: 0.016, chimeEvery: 26 },
    dashboard:  { root: 116.54,chord: [1, 1.5, 2.0, 2.5],      warmth: 0.62, cutoff: 700,  air: 0.014, chimeEvery: 38 },
    timeline:   { root: 92.50, chord: [1, 1.333, 1.8, 2.667],  warmth: 0.55, cutoff: 600,  air: 0.020, chimeEvery: 30 },
  };

  let ctx = null;
  let master = null;          // final gain to destination
  let masterLFO = null;       // breathing on master gain
  let filter = null;          // shared lowpass
  let filterLFO = null;       // breathing on cutoff
  let reverb = null;          // convolver
  let droneGain = null;
  let airGain = null;
  let oscillators = [];
  let noiseSrc = null;
  let chimeTimer = null;

  let started = false;
  let currentPreset = 'onboarding';
  let warmth = 0.5;

  const MASTER_LEVEL = 0.10;  // background, never foreground (~ -20dB)

  // ---------------------------------------------------------
  // Reverb impulse — generated, no file
  // ---------------------------------------------------------
  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        // soft, smeared tail
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function makeNoiseBuffer(seconds) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    // brownish noise — softer than white
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  // ---------------------------------------------------------
  // Build static graph (once)
  // ---------------------------------------------------------
  function buildGraph() {
    master = ctx.createGain();
    master.gain.value = 0;            // fade in later

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(3.6, 2.6);

    const reverbMix = ctx.createGain();
    reverbMix.gain.value = 0.55;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.4;

    // filter → (dry + reverb) → master → out
    filter.connect(dry);
    filter.connect(reverb);
    reverb.connect(reverbMix);
    dry.connect(master);
    reverbMix.connect(master);
    master.connect(ctx.destination);

    // breathing LFO on master gain
    masterLFO = ctx.createOscillator();
    masterLFO.frequency.value = 0.08;          // ~12.5s cycle
    const masterLFOGain = ctx.createGain();
    masterLFOGain.gain.value = MASTER_LEVEL * 0.28;
    masterLFO.connect(masterLFOGain);
    masterLFOGain.connect(master.gain);
    masterLFO.start();

    // breathing LFO on filter cutoff
    filterLFO = ctx.createOscillator();
    filterLFO.frequency.value = 0.06;          // ~16s cycle
    const filterLFOGain = ctx.createGain();
    filterLFOGain.gain.value = 180;
    filterLFO.connect(filterLFOGain);
    filterLFOGain.connect(filter.frequency);
    filterLFO.start();

    // sub-buses
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.9;
    droneGain.connect(filter);

    airGain = ctx.createGain();
    airGain.gain.value = 0.0;
    airGain.connect(filter);
  }

  // ---------------------------------------------------------
  // Voices for a preset
  // ---------------------------------------------------------
  function buildVoices(preset) {
    teardownVoices();
    const p = PRESETS[preset] || PRESETS.onboarding;

    // drone chord
    p.chord.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : (i % 2 ? 'triangle' : 'sine');
      osc.frequency.value = p.root * ratio;
      osc.detune.value = (Math.random() - 0.5) * 8;   // alive, slightly out

      const g = ctx.createGain();
      // higher partials quieter
      g.gain.value = 0.28 / (i + 1);

      // slow per-voice shimmer
      const shimmer = ctx.createOscillator();
      shimmer.frequency.value = 0.05 + Math.random() * 0.08;
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = g.gain.value * 0.4;
      shimmer.connect(shimmerGain);
      shimmerGain.connect(g.gain);
      shimmer.start();

      osc.connect(g);
      g.connect(droneGain);
      osc.start();
      oscillators.push(osc, shimmer);
    });

    // air / texture noise
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = makeNoiseBuffer(6);
    noiseSrc.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.6;
    noiseSrc.connect(bp);
    bp.connect(airGain);
    noiseSrc.start();

    // apply preset params (warmth-aware)
    applyPresetParams(p);
  }

  function applyPresetParams(p) {
    const now = ctx.currentTime;
    const w = warmth;
    // warmer = brighter-but-soft cutoff lift + a touch more reverb feel
    const cutoff = p.cutoff * (0.7 + w * 0.7);
    filter.frequency.setTargetAtTime(cutoff, now, 2.5);
    airGain.gain.setTargetAtTime(p.air * (0.6 + (1 - w) * 0.8), now, 2.5); // cooler = more air
  }

  function teardownVoices() {
    oscillators.forEach((o) => { try { o.stop(); } catch (e) {} });
    oscillators = [];
    if (noiseSrc) { try { noiseSrc.stop(); } catch (e) {} noiseSrc = null; }
  }

  // ---------------------------------------------------------
  // Chimes — rare, soft emotional tones
  // ---------------------------------------------------------
  function scheduleChimes() {
    clearTimeout(chimeTimer);
    const p = PRESETS[currentPreset] || PRESETS.onboarding;
    const next = (p.chimeEvery * 1000) * (0.6 + Math.random() * 0.8);
    chimeTimer = setTimeout(() => {
      if (started) { chime(); scheduleChimes(); }
    }, next);
  }

  function chime() {
    if (!ctx || !started) return;
    const p = PRESETS[currentPreset] || PRESETS.onboarding;
    // choose a chord tone an octave or two up
    const ratio = p.chord[1 + Math.floor(Math.random() * (p.chord.length - 1))];
    const freq = p.root * ratio * 2;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.06, now + 0.8);    // soft swell
    g.gain.exponentialRampToValueAtTime(0.0001, now + 6.0); // long tail

    osc.connect(g);
    g.connect(filter);
    osc.start(now);
    osc.stop(now + 6.2);
  }

  // ---------------------------------------------------------
  // Public API
  // ---------------------------------------------------------
  function start(preset) {
    if (started) { if (preset) setPreset(preset); return; }
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;            // no Web Audio — silently no-op
      ctx = new AC();
      buildGraph();
    }
    if (ctx.state === 'suspended') ctx.resume();

    currentPreset = preset && PRESETS[preset] ? preset : currentPreset;
    buildVoices(currentPreset);
    started = true;

    // fade in
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + 4.0);

    scheduleChimes();
  }

  function setPreset(preset) {
    if (!PRESETS[preset]) return;
    currentPreset = preset;
    if (!started) return;
    // crossfade voices: dip drone, rebuild, lift
    const now = ctx.currentTime;
    droneGain.gain.setTargetAtTime(0.0, now, 0.8);
    setTimeout(() => {
      buildVoices(currentPreset);
      droneGain.gain.setTargetAtTime(0.9, ctx.currentTime, 1.4);
      scheduleChimes();
    }, 1400);
  }

  function setWarmth(value) {
    warmth = Math.max(0, Math.min(1, value));
    if (started) applyPresetParams(PRESETS[currentPreset] || PRESETS.onboarding);
  }

  function stop() {
    if (!started || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 4.0);
    clearTimeout(chimeTimer);
    started = false;
    setTimeout(() => { teardownVoices(); }, 4200);
  }

  function isPlaying() { return started; }
  function currentName() { return currentPreset; }

  // auto-stop when tab is hidden (don't haunt the background)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && started && master) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      } else if (!document.hidden && started && master) {
        master.gain.setTargetAtTime(MASTER_LEVEL, ctx.currentTime, 1.5);
      }
    });
  }

  global.TasteAmbient = {
    start, stop, setPreset, setWarmth, chime, isPlaying, currentName,
    presets: Object.keys(PRESETS),
  };

})(typeof window !== 'undefined' ? window : this);
