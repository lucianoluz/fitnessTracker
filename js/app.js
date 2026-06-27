// App bootstrap. Registers the service worker (so the app is installable and
// works offline) and wires the global equipment toggle that switches the whole
// app between Dumbbell and Bodyweight modes.
(function () {
  'use strict';

  // --- Equipment toggle (Dumbbell / Bodyweight) ---
  const equipToggle = document.querySelector('.equip-toggle');

  function reflectEquipment(mode) {
    if (!equipToggle) return;
    equipToggle.querySelectorAll('.equip-opt').forEach((btn) => {
      const on = btn.getAttribute('data-equip') === mode;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  if (equipToggle && window.Storage) {
    reflectEquipment(Storage.getEquipment());
    equipToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.equip-opt');
      if (!btn) return;
      const mode = btn.getAttribute('data-equip');
      if (mode === Storage.getEquipment()) return;
      Storage.setEquipment(mode);
      reflectEquipment(mode);
      // Refresh views that depend on the mode. The panel re-reads on next open.
      if (window.Session) Session.show();
      if (window.Panel && Panel.isOpen && Panel.isOpen()) Panel.close();
    });
  }

  const statusEl = document.getElementById('sw-status');

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .then(() => setStatus('Service worker: registered ✓ (offline-ready)'))
        .catch((err) => setStatus('Service worker: failed — ' + err.message));
    });
  } else {
    setStatus('Service worker: not supported in this browser');
  }
})();
