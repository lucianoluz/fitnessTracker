// Workout log persistence (localStorage). One entry per logged exercise:
//   { id, exerciseId, exerciseName, muscles, date (ISO), weight, reps, sets }
// All views (per-exercise "last used", history-by-day, single-exercise
// progression) are derived from this single list.
const Storage = (function () {
  'use strict';

  const KEY = 'wt_logs';
  const EQUIP_KEY = 'wt_equipment';
  const PLAN_KEY = 'wt_plan_choice';

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

  // --- Equipment mode ('dumbbell' | 'bodyweight'), persisted globally. ---
  function getEquipment() {
    const v = localStorage.getItem(EQUIP_KEY);
    return v === 'bodyweight' ? 'bodyweight' : 'dumbbell';
  }

  function setEquipment(mode) {
    localStorage.setItem(EQUIP_KEY, mode === 'bodyweight' ? 'bodyweight' : 'dumbbell');
  }

  // --- Chosen plan per equipment mode, e.g. { dumbbell: 'db-main' }. ---
  function readPlanChoice() {
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function getPlanChoice(equipment) {
    return readPlanChoice()[equipment] || null;
  }

  function setPlanChoice(equipment, planId) {
    const obj = readPlanChoice();
    obj[equipment] = planId;
    localStorage.setItem(PLAN_KEY, JSON.stringify(obj));
  }

  // --- Session markers: one record per completed/skipped session. These drive
  // the rotation and the "skipped" history labels. They live in the same log
  // list as exercise entries but carry kind:'session'. ---
  function addSessionMarker({ planId, sessionId, sessionName, status, date }) {
    return addLog({
      kind: 'session',
      planId,
      sessionId,
      sessionName,
      status: status === 'skipped' ? 'skipped' : 'completed',
      date: date || new Date().toISOString(),
    });
  }

  // Most recent session marker for a plan (completed OR skipped), or null.
  function getLastSessionMarker(planId) {
    return getLogs().find((l) => l.kind === 'session' && l.planId === planId) || null;
  }

  return {
    addLog,
    getLogs,
    getLogsForExercise,
    getLastEntry,
    getLogsByDay,
    deleteLog,
    getEquipment,
    setEquipment,
    getPlanChoice,
    setPlanChoice,
    addSessionMarker,
    getLastSessionMarker,
  };
})();

window.Storage = Storage;
