// Bottom-tab navigation. Shows exactly one .screen at a time and reflects the
// active tab. Opening the History tab refreshes it (so freshly logged sets
// appear); opening the Body tab nudges a resize so the 3D canvas re-fits after
// being display:none.
(function () {
  'use strict';

  const tabs = Array.from(document.querySelectorAll('.tabbar .tab'));
  const screens = Array.from(document.querySelectorAll('.screens .screen'));

  function activate(name) {
    screens.forEach((s) => { s.hidden = s.getAttribute('data-screen') !== name; });
    tabs.forEach((t) => {
      const on = t.getAttribute('data-screen') === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (name === 'history' && window.History) History.show();
    if (name === 'session' && window.Session) Session.show();
    if (name === 'body') window.dispatchEvent(new Event('resize'));
  }

  tabs.forEach((t) => t.addEventListener('click', () => activate(t.getAttribute('data-screen'))));

  activate('body');
})();
