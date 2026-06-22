// Workout log persistence (localStorage). One entry per logged exercise:
//   { id, exerciseId, exerciseName, muscles, date (ISO), weight, reps, sets }
// All views (per-exercise "last used", history-by-day, single-exercise
// progression) are derived from this single list.
const Storage = (function () {
  'use strict';

  const KEY = 'wt_logs';

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('Could not read workout log', e);
      return [];
    }
  }

  function writeAll(logs) {
    try {
      localStorage.setItem(KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save workout log', e);
    }
  }

  // Most-recent-first by date.
  function byDateDesc(a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  }

  // Add one entry. `date` defaults to now; an explicit ISO date may be passed
  // (used by the batch "Session" screen so a whole workout shares one day).
  function addLog(entry) {
    const logs = readAll();
    const rec = Object.assign(
      {
        id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        date: new Date().toISOString(),
      },
      entry,
    );
    logs.push(rec);
    writeAll(logs);
    return rec;
  }

  function getLogs() {
    return readAll().sort(byDateDesc);
  }

  function getLogsForExercise(exerciseId) {
    return getLogs().filter((l) => l.exerciseId === exerciseId);
  }

  // Most recent entry for an exercise, or null.
  function getLastEntry(exerciseId) {
    return getLogsForExercise(exerciseId)[0] || null;
  }

  // Group entries by calendar day, most recent day first:
  //   [{ day: 'YYYY-MM-DD', entries: [...] }]
  function getLogsByDay() {
    const order = [];
    const byDay = new Map();
    for (const l of getLogs()) {
      const day = (l.date || '').slice(0, 10);
      if (!byDay.has(day)) {
        byDay.set(day, []);
        order.push(day);
      }
      byDay.get(day).push(l);
    }
    return order.map((day) => ({ day, entries: byDay.get(day) }));
  }

  function deleteLog(id) {
    writeAll(readAll().filter((l) => l.id !== id));
  }

  return {
    addLog,
    getLogs,
    getLogsForExercise,
    getLastEntry,
    getLogsByDay,
    deleteLog,
  };
})();

window.Storage = Storage;
