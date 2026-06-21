// App bootstrap. For now this only registers the service worker so the app
// is installable and works offline. Feature modules will be wired in here later.
(function () {
  'use strict';

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
