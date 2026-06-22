// Feature 1: tappable body diagram.
// Wires each SVG .zone to open the panel listing the exercises tagged to that
// muscle group. Exercise data comes from js/exercises.js. (Logging inputs are
// added in Feature 2 — for now each exercise shows its current working numbers.)
(function () {
  'use strict';

  const panel = document.querySelector('.panel');
  const backdrop = document.querySelector('.backdrop');
  const panelTitle = document.getElementById('panel-title');
  const panelBody = panel.querySelector('.panel-body');
  const closeBtn = panel.querySelector('.panel-close');
  const zones = Array.from(document.querySelectorAll('.zone'));

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

  function openPanel(muscle) {
    panelTitle.textContent = MUSCLE_LABELS[muscle] || 'Exercises';
    renderExercises(muscle);
    backdrop.hidden = false;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    // Defer the open class one frame so the slide-up transition runs.
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      panel.classList.add('open');
    });
    zones.forEach((z) => z.classList.toggle('is-selected', z.dataset.muscle === muscle));
  }

  function closePanel() {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    zones.forEach((z) => z.classList.remove('is-selected'));
    // Hide after the transition so it's not focusable while off-screen.
    const onEnd = () => {
      panel.hidden = true;
      backdrop.hidden = true;
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }

  zones.forEach((zone) => {
    const activate = () => openPanel(zone.dataset.muscle);
    zone.addEventListener('click', activate);
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });
})();
