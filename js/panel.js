// Exercise panel (bottom sheet) — shared UI used by the 3D body viewer.
// Exposes window.Panel.open(muscle) / window.Panel.close(). An optional
// onClose callback lets the viewer clear its highlight when the sheet closes.
const Panel = (function () {
  'use strict';

  const panel = document.querySelector('.panel');
  const backdrop = document.querySelector('.backdrop');
  const panelTitle = document.getElementById('panel-title');
  const panelBody = panel.querySelector('.panel-body');
  const closeBtn = panel.querySelector('.panel-close');

  let onCloseCb = null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function exerciseById(id) {
    return (typeof EXERCISES !== 'undefined' ? EXERCISES : []).find((e) => e.id === id);
  }

  // Human-friendly date for a stored ISO string: "today", "yesterday", or a
  // short local date.
  function relDay(iso) {
    const day = (iso || '').slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (day === today) return 'today';
    if (day === yest) return 'yesterday';
    const d = new Date(iso);
    return isNaN(d) ? day : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // The "last used" / target line for an exercise card.
  function statusLine(ex) {
    const last = window.Storage && Storage.getLastEntry(ex.id);
    if (last) {
      const sets = last.sets ? ` × ${escapeHtml(String(last.sets))}` : '';
      const reps = last.reps ? ` · ${escapeHtml(String(last.reps))}` : '';
      return `<span class="exercise-last">Last: <strong>${escapeHtml(String(last.weight || '—'))}</strong>${reps}${sets} <span class="muted">(${escapeHtml(relDay(last.date))})</span></span>`;
    }
    return `<span class="exercise-last muted">Target: ${escapeHtml(ex.weight)} · ${escapeHtml(ex.repsSets)}</span>`;
  }

  // Prefill the log inputs from the last entry, falling back to the catalog.
  function prefill(ex) {
    const last = window.Storage && Storage.getLastEntry(ex.id);
    return {
      weight: last ? last.weight : ex.weight,
      reps: last ? last.reps : '',
      sets: last ? last.sets : 3,
    };
  }

  function renderCard(ex) {
    const p = prefill(ex);
    return `
      <article class="exercise-card" data-ex="${escapeHtml(ex.id)}">
        <h3>${escapeHtml(ex.name)}</h3>
        <p class="exercise-status">${statusLine(ex)}</p>
        <p class="exercise-cue">${escapeHtml(ex.cue)}</p>
        <div class="log-form">
          <label class="log-field">Weight
            <input type="text" class="log-input" data-field="weight" value="${escapeHtml(String(p.weight ?? ''))}" />
          </label>
          <label class="log-field">Reps
            <input type="text" inputmode="numeric" class="log-input" data-field="reps" value="${escapeHtml(String(p.reps ?? ''))}" />
          </label>
          <label class="log-field log-field-sets">Sets
            <input type="number" inputmode="numeric" min="0" class="log-input" data-field="sets" value="${escapeHtml(String(p.sets ?? ''))}" />
          </label>
          <button type="button" class="log-save">Save</button>
        </div>
      </article>`;
  }

  function renderExercises(muscle) {
    const list = exercisesForMuscle(muscle);
    if (!list.length) {
      panelBody.innerHTML = '<p class="muted">No exercises tagged to this group yet.</p>';
      return;
    }
    panelBody.innerHTML = list.map(renderCard).join('');
  }

  // Save the values currently entered in one exercise card.
  function saveCard(card) {
    const ex = exerciseById(card.getAttribute('data-ex'));
    if (!ex) return;
    const val = (field) => {
      const el = card.querySelector(`.log-input[data-field="${field}"]`);
      return el ? el.value.trim() : '';
    };
    Storage.addLog({
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscles: ex.muscles,
      weight: val('weight'),
      reps: val('reps'),
      sets: val('sets'),
    });
    // Refresh the status line and flash the button.
    const status = card.querySelector('.exercise-status');
    if (status) status.innerHTML = statusLine(ex);
    const btn = card.querySelector('.log-save');
    if (btn) {
      btn.textContent = 'Saved ✓';
      btn.classList.add('saved');
      setTimeout(() => { btn.textContent = 'Save'; btn.classList.remove('saved'); }, 1500);
    }
  }

  panelBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.log-save');
    if (!btn) return;
    const card = btn.closest('.exercise-card');
    if (card) saveCard(card);
  });

  function open(muscle) {
    panelTitle.textContent = MUSCLE_LABELS[muscle] || 'Exercises';
    renderExercises(muscle);
    backdrop.hidden = false;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      panel.classList.add('open');
    });
  }

  function close() {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      panel.hidden = true;
      backdrop.hidden = true;
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
    // Fallback in case transitionend never fires (e.g. reduced motion).
    setTimeout(onEnd, 350);
    if (onCloseCb) onCloseCb();
  }

  function isOpen() {
    return !panel.hidden;
  }

  // The ghost click that follows the opening tap is swallowed at the source in
  // body3d.js, so these handlers only ever see genuine user closes.
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  return {
    open,
    close,
    isOpen,
    onClose(cb) { onCloseCb = cb; },
  };
})();

window.Panel = Panel;
