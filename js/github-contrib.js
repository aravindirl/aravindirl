(function () {
  var USER = 'aravindirl';
  var root = document.querySelector('[data-gh-contrib]');
  if (!root) return;

  var summaryEl = root.querySelector('[data-gh-summary]');
  var calendarEl = root.querySelector('[data-gh-calendar]');
  var year = new Date().getFullYear();
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY_LABELS = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

  function parseUTC(dateStr) {
    var p = dateStr.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }

  function formatCount(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function ymd(date) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, '0');
    var d = String(date.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function buildWeeks(days) {
    var byDate = Object.create(null);
    days.forEach(function (d) { byDate[d.date] = d; });

    var first = parseUTC(year + '-01-01');
    var last = parseUTC(year + '-12-31');
    var cursor = new Date(first);
    cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay()); // Sunday on/before Jan 1

    var weeks = [];
    while (cursor <= last) {
      var week = [];
      for (var i = 0; i < 7; i++) {
        var key = ymd(cursor);
        if (cursor >= first && cursor <= last) {
          week.push(byDate[key] || { date: key, count: 0, level: 0 });
        } else {
          week.push(null);
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  function monthLabels(weeks) {
    var labels = [];
    var prev = -1;
    weeks.forEach(function (week) {
      var firstDay = null;
      for (var i = 0; i < week.length; i++) {
        if (week[i]) { firstDay = week[i]; break; }
      }
      if (!firstDay) {
        labels.push(null);
        return;
      }
      var month = parseUTC(firstDay.date).getUTCMonth();
      if (month !== prev) {
        labels.push(MONTHS[month]);
        prev = month;
      } else {
        labels.push(null);
      }
    });
    return labels;
  }

  function render(data) {
    var total = (data.total && data.total[year]) || 0;
    if (summaryEl) {
      summaryEl.innerHTML =
        '<span class="gh-contrib-count">' + formatCount(total) + '</span> contributions in ' + year;
    }

    var weeks = buildWeeks(data.contributions || []);
    var labels = monthLabels(weeks);

    var monthsRow = document.createElement('div');
    monthsRow.className = 'gh-contrib-months';
    monthsRow.setAttribute('aria-hidden', 'true');
    var monthsGutter = document.createElement('span');
    monthsGutter.className = 'gh-contrib-months-gutter';
    monthsRow.appendChild(monthsGutter);
    var monthsTrack = document.createElement('div');
    monthsTrack.className = 'gh-contrib-months-track';
    labels.forEach(function (label) {
      var cell = document.createElement('span');
      cell.className = 'gh-contrib-month' + (label ? '' : ' is-empty');
      cell.textContent = label || '';
      monthsTrack.appendChild(cell);
    });
    monthsRow.appendChild(monthsTrack);

    var body = document.createElement('div');
    body.className = 'gh-contrib-body';

    var daysCol = document.createElement('div');
    daysCol.className = 'gh-contrib-days';
    daysCol.setAttribute('aria-hidden', 'true');
    for (var di = 0; di < 7; di++) {
      var day = document.createElement('span');
      day.className = 'gh-contrib-day';
      day.textContent = DAY_LABELS[di] || '';
      daysCol.appendChild(day);
    }

    var graph = document.createElement('div');
    graph.className = 'gh-contrib-graph';
    graph.setAttribute('role', 'img');
    graph.setAttribute('aria-label', formatCount(total) + ' contributions in ' + year);

    weeks.forEach(function (week) {
      var col = document.createElement('div');
      col.className = 'gh-contrib-week';
      week.forEach(function (cell) {
        var box = document.createElement('span');
        box.className = 'gh-contrib-cell';
        if (!cell) {
          box.classList.add('is-pad');
          box.setAttribute('aria-hidden', 'true');
        } else {
          var level = Math.max(0, Math.min(4, cell.level | 0));
          box.dataset.level = String(level);
          var when = parseUTC(cell.date);
          var nice = when.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
          });
          box.title = cell.count === 1
            ? '1 contribution on ' + nice
            : cell.count + ' contributions on ' + nice;
        }
        col.appendChild(box);
      });
      graph.appendChild(col);
    });

    body.appendChild(daysCol);
    body.appendChild(graph);

    calendarEl.innerHTML = '';
    calendarEl.appendChild(monthsRow);
    calendarEl.appendChild(body);
    root.classList.add('is-ready');
    root.classList.remove('is-error');
  }

  function fail() {
    root.classList.add('is-error');
    if (summaryEl) {
      summaryEl.innerHTML =
        'GitHub contributions unavailable — <a href="https://github.com/' + USER + '" target="_blank" rel="noopener noreferrer">view on GitHub</a>';
    }
    if (calendarEl) calendarEl.innerHTML = '';
  }

  fetch('https://github-contributions-api.jogruber.de/v4/' + USER + '?y=' + year, {
    credentials: 'omit'
  })
    .then(function (res) {
      if (!res.ok) throw new Error('bad status');
      return res.json();
    })
    .then(render)
    .catch(fail);
})();
