// Native health bridge using `capacitor-health` plugin.
// In a Capacitor app this talks to Apple HealthKit / Android Health Connect.
// In a plain web browser everything no-ops and returns null so the game
// gracefully falls back to time-only EXP.
//
// API reference: https://github.com/mley/capacitor-health

const Health = (() => {

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  function plugin() {
    return window.Capacitor?.Plugins?.Health || null;
  }

  async function isAvailable() {
    const p = plugin();
    if (!p) return false;
    try { return (await p.isHealthAvailable()).available === true; }
    catch { return false; }
  }

  // Request permissions for heart rate, active calories, workouts, steps.
  async function requestPermissions() {
    if (!isNative()) return { granted: false, reason: 'web' };
    const p = plugin();
    if (!p) return { granted: false, reason: 'no-plugin' };
    if (!(await isAvailable())) return { granted: false, reason: 'no-health-app' };
    try {
      await p.requestHealthPermissions({
        permissions: [
          'READ_HEART_RATE',
          'READ_ACTIVE_CALORIES',
          'READ_TOTAL_CALORIES',
          'READ_WORKOUTS',
          'READ_STEPS',
        ],
      });
      return { granted: true };
    } catch (e) {
      return { granted: false, reason: 'denied', error: String(e) };
    }
  }

  // Read aggregated health data for the workout window [startedAtMs, endedAtMs].
  // Strategy:
  //   1. Look for a Workout record overlapping our timer window — gives
  //      avg heart rate + calories from the user's watch directly.
  //   2. If no workout was logged on the device, fall back to aggregated
  //      active-calories for the same window.
  // Returns { avgHeartRate, calories } or null if no data.
  async function readWorkoutData(startedAtMs, endedAtMs) {
    if (!isNative()) return null;
    const p = plugin();
    if (!p) return null;

    // Pad the window slightly so a workout that started a few seconds before
    // we hit "Start" still gets matched.
    const pad = 60 * 1000;
    const start = new Date(startedAtMs - pad).toISOString();
    const end   = new Date(endedAtMs + pad).toISOString();

    let avgHeartRate = null;
    let calories = null;

    // 1) Try to find a matching Workout record.
    try {
      const res = await p.queryWorkouts({
        startDate: start,
        endDate: end,
        includeHeartRate: true,
        includeRoute: false,
        includeSteps: false,
      });
      const overlapping = (res?.workouts || []).filter(w => {
        const ws = new Date(w.startDate).getTime();
        const we = new Date(w.endDate).getTime();
        return we >= startedAtMs && ws <= endedAtMs;
      });
      if (overlapping.length) {
        const workout = overlapping.sort((a, b) => b.duration - a.duration)[0];
        const hrSamples = workout.heartRate || [];
        const bpms = hrSamples.map(s => s.bpm).filter(n => typeof n === 'number');
        if (bpms.length) avgHeartRate = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
        if (typeof workout.calories === 'number' && workout.calories > 0) {
          calories = Math.round(workout.calories);
        }
      }
    } catch (e) {
      console.warn('[Health] queryWorkouts failed:', e);
    }

    // 2) Fall back to aggregated active calories if we didn't get any.
    if (calories == null) {
      try {
        const res = await p.queryAggregated({
          startDate: start,
          endDate: end,
          dataType: 'active-calories',
          bucket: 'day',
        });
        const total = (res?.aggregatedData || []).reduce((s, d) => s + (d.value || 0), 0);
        if (total > 0) calories = Math.round(total);
      } catch (e) {
        console.warn('[Health] queryAggregated failed:', e);
      }
    }

    if (avgHeartRate == null && calories == null) return null;
    return { avgHeartRate, calories };
  }

  function openSettings() {
    const p = plugin();
    if (!p) return;
    if (window.Capacitor?.getPlatform?.() === 'ios') p.openAppleHealthSettings?.();
    else p.openHealthConnectSettings?.();
  }

  return { isNative, isAvailable, requestPermissions, readWorkoutData, openSettings };
})();
