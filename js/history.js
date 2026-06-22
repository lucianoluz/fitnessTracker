// History screen. Two views, derived entirely from Storage:
//   - "days":     every logged entry grouped into day blocks (most recent first)
//   - "exercise": drill into one exercise to see its progression over time
// Tapping an entry in the day view drills into that exercise; the back button
// returns. window.History.show() (called when the tab opens) resets to the day
// view and re-renders so new logs always appear.
const History = (function () {
  'use strict';

  const screen = document.querySelector('.history-screen');
  const titleEl = screen.querySelector('.screen-title');
  const backBtn = screen.querySelector('.back-btn');
  const bodyEl = screen.querySelector('.history-body');

  // Current view: { mode: 'days' } or { mode: 'exercise', exerciseId, name }.
  let view = { mode: 'days' };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // "Today" / "Yesterday" / "Mon, Jun 22" for a 'YYYY-MM-DD' day key.
  function fmtDay(dayStr) {
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dayStr === today) return 'Today';
    if (dayStr === yest) return 'Yesterday';
    const d = new Date(dayStr + 'T00:00:00');
    return isNaN(d)
      ? dayStr
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Full date label for a stored ISO string (used in the progression view).
  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? (iso || '').slice(0, 10) : d.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  // weight · reps × sets, mirroring the panel's status line.
  function detail(entry) {
    const weight = `<strong>${escapeHtml(String(entry.weight || '—'))}</strong>`;
    const reps = entry.reps ? ` · ${escapeHtml(String(entry.reps))}` : '';
    const sets = entry.sets ? ` × ${escapeHtml(String(entry.sets))}` : '';
    return `${weight}${reps}${sets}`;
  }

  function row(primary, entry, drillId) {
    const main = drillId
      ? `<button type="button" class="log-row-main" data-ex="${escapeHtml(drillId)}">`
      : '<div class="log-row-main">';
    const mainClose = drillId ? '</button>' : '</div>';
    return `<div class="log-row">
        ${main}
          <span class="log-row-name">${escapeHtml(primary)}</span>
          <span class="log-row-detail">${detail(entry)}</span>
        ${mainClose}
        <button type="button" class="log-del" data-id="${escapeHtml(entry.id)}" aria-label="Delete entry">×</button>
      </div>`;
  }

  function renderDays() {
    const byDay = window.Storage ? Storage.getLogsByDay() : [];
    if (!byDay.length) {
      bodyEl.innerHTML = '<p class="muted empty">No workouts logged yet. Tap a muscle on the Body tab to log your first set.</p>';
      return;
    }
    bodyEl.innerHTML = byDay.map(({ day, entries }) => `
      <section class="day-block">
        <h3 class="day-heading">${escapeHtml(fmtDay(day))}</h3>
        ${entries.map((e) => row(e.exerciseName, e, e.exerciseId)).join('')}
      </section>`).join('');
  }

  function renderExercise() {
    const logs = window.Storage ? Storage.getLogsForExercise(view.exerciseId) : [];
    if (!logs.length) {
      bodyEl.innerHTML = '<p class="muted empty">No entries left for this exercise.</p>';
      return;
    }
    bodyEl.innerHTML = `<div class="day-block">${
      logs.map((e) => row(fmtDate(e.date), e, null)).join('')
    }</div>`;
  }

  function render() {
    if (view.mode === 'exercise') {
      backBtn.hidden = false;
      titleEl.textContent = view.name;
      renderExercise();
    } else {
      backBtn.hidden = true;
      titleEl.textContent = 'History';
      renderDays();
    }
  }

  function drillInto(exerciseId) {
    const first = window.Storage ? Storage.getLogsForExercise(exerciseId)[0] : null;
    const name = first ? first.exerciseName : exerciseId;
    view = { mode: 'exercise', exerciseId, name };
    render();
  }

  bodyEl.addEventListener('click', (e) => {
    const del = e.target.closest('.log-del');
    if (del) {
      const id = del.getAttribute('data-id');
      if (id && window.confirm('Delete this entry?')) {
        Storage.deleteLog(id);
        // Drilling down and deleting the last entry drops us back to the days.
        if (view.mode === 'exercise' && !Storage.getLogsForExercise(view.exerciseId).length) {
          view = { mode: 'days' };
        }
        render();
      }
      return;
    }
    const main = e.target.closest('.log-row-main');
    if (main && view.mode === 'days') drillInto(main.getAttribute('data-ex'));
  });

  backBtn.addEventListener('click', () => {
    view = { mode: 'days' };
    render();
  });

  // Called by the nav each time the History tab is opened.
  function show() {
    view = { mode: 'days' };
    render();
  }

  return { show, render };
})();

window.History = History;
