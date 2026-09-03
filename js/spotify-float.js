(function () {
  var widget = document.getElementById('spotify-float');
  if (!widget) return;

  var handle = widget.querySelector('[data-spotify-drag]');
  var iframe = widget.querySelector('iframe');
  var KEY = 'spotify-float-pos-v2';
  var dragging = false;
  var startX = 0;
  var startY = 0;
  var originLeft = 0;
  var originTop = 0;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function place(left, top) {
    var maxLeft = Math.max(8, window.innerWidth - widget.offsetWidth - 8);
    var maxTop = Math.max(8, window.innerHeight - widget.offsetHeight - 8);
    left = clamp(left, 8, maxLeft);
    top = clamp(top, 8, maxTop);
    widget.style.left = left + 'px';
    widget.style.top = top + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    return { left: left, top: top };
  }

  function restore() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
        place(saved.left, saved.top);
        return;
      }
    } catch (e) { /* ignore */ }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        left: widget.offsetLeft,
        top: widget.offsetTop
      }));
    } catch (e) { /* ignore */ }
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('a')) return;
    dragging = true;
    widget.classList.add('is-dragging');
    if (iframe) iframe.style.pointerEvents = 'none';
    startX = e.clientX;
    startY = e.clientY;
    var rect = widget.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    if (handle.setPointerCapture) {
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    place(originLeft + (e.clientX - startX), originTop + (e.clientY - startY));
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    widget.classList.remove('is-dragging');
    if (iframe) iframe.style.pointerEvents = '';
    if (handle.releasePointerCapture) {
      try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    persist();
  }

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('resize', function () {
    if (!widget.style.left) return;
    place(parseFloat(widget.style.left) || 0, parseFloat(widget.style.top) || 0);
    persist();
  });

  restore();
})();
