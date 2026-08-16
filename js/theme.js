(function () {
  var root = document.documentElement;
  var KEY = 'theme';

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    try {
      localStorage.setItem(KEY, theme);
    } catch (e) { /* ignore */ }

    var next = theme === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.textContent = next;
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('title', 'Switch to ' + next + ' mode (t)');
    });

    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  function toggle() {
    apply(current() === 'dark' ? 'light' : 'dark');
  }

  function isTyping(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!el.isContentEditable;
  }

  function isDesktop() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      if (btn.getAttribute('data-theme-bound') === '1') return;
      btn.setAttribute('data-theme-bound', '1');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });

    if (document.documentElement.getAttribute('data-theme-keys') !== '1') {
      document.documentElement.setAttribute('data-theme-keys', '1');
      document.addEventListener('keydown', function (e) {
        if (e.key !== 't' && e.key !== 'T') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.repeat) return;
        if (!isDesktop()) return;
        if (isTyping(document.activeElement)) return;
        e.preventDefault();
        toggle();
      });
    }

    apply(current());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.siteTheme = { apply: apply, toggle: toggle, current: current };
})();
