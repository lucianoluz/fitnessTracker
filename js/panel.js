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
  let openedAt = 0;     // timestamp of the last open(), to swallow ghost clicks

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function renderExercises(muscle) {
    const list = exercisesForMuscle(muscle);
    if (!list.length) {
      panelBody.innerHTML = '<p class="muted">No exercises tagged to this group yet.</p>';
      return;
    }
    panelBody.innerHTML = list.map((ex) => `
      <article class="exercise-card">
        <h3>${escapeHtml(ex.name)}</h3>
        <p class="exercise-meta">
          <span class="weight">${escapeHtml(ex.weight)}</span>
          <span class="reps">${escapeHtml(ex.repsSets)}</span>
        </p>
        <p class="exercise-cue">${escapeHtml(ex.cue)}</p>
      </article>
    `).join('');
  }

  function open(muscle) {
    panelTitle.textContent = MUSCLE_LABELS[muscle] || 'Exercises';
    renderExercises(muscle);
    backdrop.hidden = false;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    openedAt = Date.now();
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

  // A click that arrives right after open() is the synthetic "ghost" click the
  // browser fires after the tap that opened the sheet (on touch it lands on the
  // just-revealed backdrop). Ignore it so the sheet doesn't close immediately.
  function requestClose() {
    if (Date.now() - openedAt < 400) return;
    close();
  }

  function isOpen() {
    return !panel.hidden;
  }

  closeBtn.addEventListener('click', requestClose);
  backdrop.addEventListener('click', requestClose);
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
