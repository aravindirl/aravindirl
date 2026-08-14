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
      btn.setAttribute('title', 'Switch to ' + next + ' mode');
    });

    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  function toggle() {
    apply(current() === 'dark' ? 'light' : 'dark');
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
    apply(current());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.siteTheme = { apply: apply, toggle: toggle, current: current };
})();
