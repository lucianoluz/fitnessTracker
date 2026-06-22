// "Today's Session" batch screen. Lists every exercise grouped by muscle, each
// prefilled to its last-used values (falling back to the catalog). Tick the
// ones you did, adjust the numbers, then "Save Session" logs them all under a
// single shared date via Storage.addLog({ ..., date }).
const Session = (function () {
  'use strict';

  const screen = document.querySelector('.session-screen');
  const bodyEl = screen.querySelector('.session-body');
  const saveBtn = screen.querySelector('.session-save');

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Prefill from the last entry, falling back to the catalog (mirrors panel.js).
  function prefill(ex) {
    const last = window.Storage && Storage.getLastEntry(ex.id);
    return {
      weight: last ? last.weight : ex.weight,
      reps: last ? last.reps : '',
      sets: last ? last.sets : 3,
    };
  }

  function renderEx(ex) {
    const p = prefill(ex);
    return `
      <article class="session-ex" data-ex="${escapeHtml(ex.id)}">
        <label class="session-tick">
          <input type="checkbox" class="session-check" />
          <span class="session-ex-name">${escapeHtml(ex.name)}</span>
        </label>
        <div class="session-inputs">
          <label class="log-field">Weight
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

  function render() {
    const groups = Object.keys(MUSCLE_LABELS)
      .map((key) => ({ label: MUSCLE_LABELS[key], list: exercisesForMuscle(key) }))
      .filter((g) => g.list.length);
    bodyEl.innerHTML = groups.map((g) => `
      <section class="muscle-group">
        <h3 class="muscle-heading">${escapeHtml(g.label)}</h3>
        ${g.list.map(renderEx).join('')}
      </section>`).join('');
    updateCount();
  }

  function checkedCards() {
    return Array.from(bodyEl.querySelectorAll('.session-ex')).filter(
      (c) => c.querySelector('.session-check').checked,
    );
  }

  function updateCount() {
    const n = checkedCards().length;
    saveBtn.disabled = n === 0;
    saveBtn.textContent = n ? `Save Session (${n})` : 'Save Session';
  }

  bodyEl.addEventListener('change', (e) => {
    const chk = e.target.closest('.session-check');
    if (!chk) return;
    const card = chk.closest('.session-ex');
    if (card) card.classList.toggle('is-on', chk.checked);
    updateCount();
  });

  function saveSession() {
    const cards = checkedCards();
    if (!cards.length) return;
    const date = new Date().toISOString(); // one timestamp for the whole session
    cards.forEach((card) => {
      const ex = EXERCISES.find((x) => x.id === card.getAttribute('data-ex'));
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
        date,
      });
    });
    const n = cards.length;
    saveBtn.classList.add('saved');
    saveBtn.disabled = true;
    saveBtn.textContent = `Saved ${n} ✓`;
    // Re-render after the flash so prefills pick up the new last-used values.
    setTimeout(() => {
      saveBtn.classList.remove('saved');
      render();
    }, 1500);
  }

  saveBtn.addEventListener('click', saveSession);

  // Called by the nav each time the Session tab is opened, so prefills reflect
  // the latest logs.
  function show() {
    render();
  }

  return { show, render };
})();

window.Session = Session;
