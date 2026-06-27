// "Today's Session" — routine-driven batch logging.
//
// Respects the global equipment toggle (Storage.getEquipment): only plans for
// the current mode are offered. If a mode has more than one plan (Dumbbell:
// Main + Rush) a plan dropdown appears. The screen defaults to the auto-
// suggested NEXT session for the chosen plan — computed from the last session
// marker in history, cycling in order (calendar-independent). A second dropdown
// lets you manually view/log any session in the plan.
//
//   Save  -> logs every exercise + a 'completed' session marker, advancing the
//            rotation (the next open suggests the following session).
//   Skip  -> logs a 'skipped' session marker only (no exercise data); the skip
//            is labeled in History, and the rotation still advances.
const Session = (function () {
  'use strict';

  const screen = document.querySelector('.session-screen');
  const bodyEl = screen.querySelector('.session-body');
  const saveBtn = screen.querySelector('.session-save');
  const skipBtn = screen.querySelector('.session-skip');
  const planField = screen.querySelector('.session-plan-field');
  const planSelect = screen.querySelector('.session-plan-select');
  const sessionSelect = screen.querySelector('.session-session-select');

  // Currently displayed plan/session. Reset from history each time show() runs.
  let currentPlanId = null;
  let currentSessionId = null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function relDay(iso) {
    const day = (iso || '').slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (day === today) return 'today';
    if (day === yest) return 'yesterday';
    const d = new Date(iso);
    return isNaN(d) ? day : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function equipment() {
    return window.Storage ? Storage.getEquipment() : 'dumbbell';
  }

  // The plan to show for the current mode: the remembered choice if it's still
  // valid for this equipment, otherwise the mode's first plan.
  function resolvePlan() {
    const plans = plansForEquipment(equipment());
    if (!plans.length) return null;
    const saved = Storage.getPlanChoice(equipment());
    const chosen = plans.find((p) => p.id === saved) || plans[0];
    if (chosen.id !== saved) Storage.setPlanChoice(equipment(), chosen.id);
    return chosen;
  }

  // Next session in the rotation: the one after the last logged marker for this
  // plan, wrapping around. No marker yet -> the first session.
  function suggestedSessionId(plan) {
    const last = Storage.getLastSessionMarker(plan.id);
    if (!last) return plan.sessions[0].id;
    const { index } = sessionInPlan(plan, last.sessionId);
    if (index < 0) return plan.sessions[0].id;
    return plan.sessions[(index + 1) % plan.sessions.length].id;
  }

  // Last-used line for one exercise (mirrors the panel's status line).
  function statusLine(ex) {
    const last = Storage.getLastEntry(ex.id);
    if (last) {
      const reps = last.reps ? ` · ${escapeHtml(String(last.reps))}` : '';
      const sets = last.sets ? ` × ${escapeHtml(String(last.sets))}` : '';
      return `Last: <strong>${escapeHtml(String(last.weight || '—'))}</strong>${reps}${sets} <span class="muted">(${escapeHtml(relDay(last.date))})</span>`;
    }
    return `<span class="muted">Target: ${escapeHtml(ex.weight)} · ${escapeHtml(ex.repsSets)}</span>`;
  }

  // Prefill the inputs from the last entry, falling back to the catalog. In
  // bodyweight mode the weight field is optional and shows "bodyweight".
  function prefill(ex) {
    const last = Storage.getLastEntry(ex.id);
    return {
      weight: last ? last.weight : ex.weight,
      reps: last ? last.reps : '',
      sets: last ? last.sets : 3,
    };
  }

  function renderEx(ex) {
    const p = prefill(ex);
    const weightOptional = equipment() === 'bodyweight';
    return `
      <article class="session-ex" data-ex="${escapeHtml(ex.id)}">
        <div class="session-ex-head">
          <span class="session-ex-name">${escapeHtml(ex.name)}</span>
          <span class="session-ex-last">${statusLine(ex)}</span>
        </div>
        <div class="session-inputs">
          <label class="log-field">Weight${weightOptional ? ' <span class="muted">(opt.)</span>' : ''}
            <input type="text" class="log-input" data-field="weight" value="${escapeHtml(String(p.weight ?? ''))}" />
          </label>
          <label class="log-field">Reps
            <input type="text" inputmode="numeric" class="log-input" data-field="reps" value="${escapeHtml(String(p.reps ?? ''))}" />
          </label>
          <label class="log-field log-field-sets">Sets
            <input type="number" inputmode="numeric" min="0" class="log-input" data-field="sets" value="${escapeHtml(String(p.sets ?? ''))}" />
          </label>
        </div>
      </article>`;
  }

  // Build the plan dropdown (hidden when the mode has a single plan).
  function renderPlanSelect(plans, plan) {
    planSelect.innerHTML = plans
      .map((p) => `<option value="${escapeHtml(p.id)}"${p.id === plan.id ? ' selected' : ''}>${escapeHtml(p.name)}</option>`)
      .join('');
    planField.hidden = plans.length <= 1;
  }

  // Build the session dropdown, marking the auto-suggested next session.
  function renderSessionSelect(plan, suggestedId) {
    sessionSelect.innerHTML = plan.sessions
      .map((s) => {
        const isNext = s.id === suggestedId ? ' — Next up' : '';
        const sel = s.id === currentSessionId ? ' selected' : '';
        return `<option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(s.name)}${isNext}</option>`;
      })
      .join('');
  }

  function renderBody(plan, suggestedId) {
    const { session } = sessionInPlan(plan, currentSessionId);
    if (!session) {
      bodyEl.innerHTML = '<p class="muted empty">No session selected.</p>';
      return;
    }
    const isNext = session.id === suggestedId;
    const banner = `<p class="session-banner">${isNext
      ? 'Auto-suggested next session'
      : 'Viewing a different session'}</p>`;
    const list = session.exercises
      .map((id) => exerciseById(id))
      .filter(Boolean)
      .map(renderEx)
      .join('');
    bodyEl.innerHTML = banner + list;
  }

  // Full re-render of controls + body for the current plan/session.
  function render() {
    const plans = plansForEquipment(equipment());
    if (!plans.length) {
      planField.hidden = true;
      sessionSelect.innerHTML = '';
      bodyEl.innerHTML = '<p class="muted empty">No plans for this equipment mode yet.</p>';
      saveBtn.disabled = true;
      skipBtn.disabled = true;
      return;
    }
    const plan = planById(currentPlanId) || plans[0];
    currentPlanId = plan.id;
    const suggestedId = suggestedSessionId(plan);
    if (!sessionInPlan(plan, currentSessionId).session) currentSessionId = suggestedId;

    renderPlanSelect(plans, plan);
    renderSessionSelect(plan, suggestedId);
    renderBody(plan, suggestedId);
    saveBtn.disabled = false;
    skipBtn.disabled = false;
    saveBtn.textContent = 'Save Session';
    saveBtn.classList.remove('saved');
  }

  // Read the inputs for one exercise card.
  function readCard(card) {
    const val = (field) => {
      const el = card.querySelector(`.log-input[data-field="${field}"]`);
      return el ? el.value.trim() : '';
    };
    let weight = val('weight');
    if (!weight && equipment() === 'bodyweight') weight = 'bodyweight';
    return { weight, reps: val('reps'), sets: val('sets') };
  }

  function saveSession() {
    const plan = planById(currentPlanId);
    const { session } = sessionInPlan(plan, currentSessionId);
    if (!session) return;
    const date = new Date().toISOString(); // one timestamp for the whole session
    Array.from(bodyEl.querySelectorAll('.session-ex')).forEach((card) => {
      const ex = exerciseById(card.getAttribute('data-ex'));
      if (!ex) return;
      const v = readCard(card);
      Storage.addLog({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscles: ex.muscles,
        weight: v.weight,
        reps: v.reps,
        sets: v.sets,
        date,
      });
    });
    Storage.addSessionMarker({
      planId: plan.id,
      sessionId: session.id,
      sessionName: session.name,
      status: 'completed',
      date,
    });
    saveBtn.classList.add('saved');
    saveBtn.disabled = true;
    skipBtn.disabled = true;
    saveBtn.textContent = 'Saved ✓';
    // Advance the rotation: re-render so the next session is suggested.
    setTimeout(() => {
      currentSessionId = null; // let render() pick the new suggested session
      render();
    }, 1500);
  }

  function skipSession() {
    const plan = planById(currentPlanId);
    const { session } = sessionInPlan(plan, currentSessionId);
    if (!session) return;
    if (!window.confirm(`Skip "${session.name}"? It will be logged as skipped.`)) return;
    Storage.addSessionMarker({
      planId: plan.id,
      sessionId: session.id,
      sessionName: session.name,
      status: 'skipped',
    });
    skipBtn.classList.add('skipped');
    skipBtn.textContent = 'Skipped';
    saveBtn.disabled = true;
    setTimeout(() => {
      skipBtn.classList.remove('skipped');
      skipBtn.textContent = 'Skip';
      currentSessionId = null;
      render();
    }, 1200);
  }

  planSelect.addEventListener('change', () => {
    currentPlanId = planSelect.value;
    Storage.setPlanChoice(equipment(), currentPlanId);
    currentSessionId = null; // reset to the new plan's suggested session
    render();
  });

  sessionSelect.addEventListener('change', () => {
    currentSessionId = sessionSelect.value; // manual override
    const plan = planById(currentPlanId);
    renderBody(plan, suggestedSessionId(plan));
  });

  saveBtn.addEventListener('click', saveSession);
  skipBtn.addEventListener('click', skipSession);

  // Called by the nav each time the Session tab opens (and when the equipment
  // toggle changes) so the plan, suggestion and prefills are always current.
  function show() {
    currentPlanId = (resolvePlan() || {}).id || null;
    currentSessionId = null;
    render();
  }

  return { show, render };
})();

window.Session = Session;
