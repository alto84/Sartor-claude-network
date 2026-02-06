/* ============================================
   SARTOR Dashboard - WebSocket Client & Logic
   ============================================ */

(function () {
  'use strict';

  var socket = io({ reconnection: true, reconnectionDelay: 2000, reconnectionAttempts: Infinity });
  var logCount = 0;

  // ---- Connection Status ----

  function setConnected(connected) {
    var dot = document.getElementById('status-dot');
    var label = document.getElementById('connection-label');
    if (connected) {
      dot.classList.add('connected');
      label.textContent = 'Connected';
    } else {
      dot.classList.remove('connected');
      label.textContent = 'Disconnected';
    }
  }

  socket.on('connect', function () {
    setConnected(true);
    addLog('Connected to server', 'success');
    fetchInitialData();
  });

  socket.on('disconnect', function () {
    setConnected(false);
    addLog('Disconnected from server', 'error');
  });

  socket.on('reconnect_attempt', function () {
    addLog('Reconnecting...', 'warning');
  });

  // ---- Time Helpers ----

  function timeAgo(dateStr) {
    if (!dateStr) return '--';
    var then = (typeof dateStr === 'number') ? new Date(dateStr * 1000) : new Date(dateStr);
    if (isNaN(then.getTime())) return dateStr;
    var seconds = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
    if (seconds < 60) return seconds + 's ago';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }

  function formatTime(date) {
    if (!date) date = new Date();
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '--';
    seconds = Math.floor(seconds);
    var d = Math.floor(seconds / 86400);
    var h = Math.floor((seconds % 86400) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  // ---- Simple Markdown to HTML ----

  function mdToHtml(text) {
    if (!text) return '';
    var lines = text.split('\n');
    var html = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (inList && !/^\s*[-*]\s/.test(line)) {
        html.push('</ul>');
        inList = false;
      }

      if (/^### (.+)/.test(line)) {
        html.push('<h3>' + inlineFormat(line.replace(/^### /, '')) + '</h3>');
      } else if (/^## (.+)/.test(line)) {
        html.push('<h2>' + inlineFormat(line.replace(/^## /, '')) + '</h2>');
      } else if (/^# (.+)/.test(line)) {
        html.push('<h1>' + inlineFormat(line.replace(/^# /, '')) + '</h1>');
      } else if (/^\s*[-*]\s(.+)/.test(line)) {
        if (!inList) { html.push('<ul>'); inList = true; }
        html.push('<li>' + inlineFormat(line.replace(/^\s*[-*]\s/, '')) + '</li>');
      } else if (line.trim() === '') {
        if (inList) { html.push('</ul>'); inList = false; }
      } else {
        html.push('<p>' + inlineFormat(line) + '</p>');
      }
    }
    if (inList) html.push('</ul>');
    return html.join('\n');
  }

  function inlineFormat(text) {
    text = escapeHtml(text);
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return text;
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---- Value Flash Helper ----

  function flashValue(el) {
    el.classList.remove('value-changed');
    void el.offsetWidth;
    el.classList.add('value-changed');
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    var old = el.textContent;
    if (old !== value) {
      el.textContent = value;
      if (old !== '--') flashValue(el);
    }
  }

  // ---- Progress Bar ----

  function setBar(barId, pct) {
    var bar = document.getElementById(barId);
    if (!bar) return;
    var clamped = Math.min(100, Math.max(0, pct));
    bar.style.width = clamped + '%';
    bar.classList.remove('warn', 'danger');
    if (clamped >= 80) bar.classList.add('danger');
    else if (clamped >= 60) bar.classList.add('warn');
  }

  // ---- Panel: System Health ----
  // data format from app.py status_update: {gpu: {temp, utilization, vram_used, vram_total, name}, cpu: {usage, cores, load_1m}, ram: {used_mb, total_mb}, uptime, timestamp}

  function updateSystemHealth(data) {
    if (!data) return;
    var gpu = data.gpu || {};
    var cpu = data.cpu || {};
    var ram = data.ram || {};

    var temp = gpu.temp || 0;
    setVal('gpu-temp-val', temp + '\u00B0C');
    setBar('gpu-temp-bar', temp);

    var util = gpu.utilization || 0;
    setVal('gpu-util-val', util + '%');
    setBar('gpu-util-bar', util);

    var cpuUsage = cpu.usage || 0;
    setVal('cpu-val', cpuUsage + '%');
    setBar('cpu-bar', cpuUsage);

    var ramTotal = ram.total_mb || 1;
    var ramUsed = ram.used_mb || 0;
    var ramPct = Math.round((ramUsed / ramTotal) * 100);
    setVal('ram-val', Math.round(ramUsed / 1024) + '/' + Math.round(ramTotal / 1024) + ' GB');
    setBar('ram-bar', ramPct);

    var badge = document.getElementById('health-badge');
    if (badge) {
      var maxVal = Math.max(temp, util, cpuUsage, ramPct);
      if (maxVal >= 80) { badge.textContent = 'High'; badge.className = 'card-badge accent-danger'; }
      else if (maxVal >= 60) { badge.textContent = 'Busy'; badge.className = 'card-badge accent-warn'; }
      else { badge.textContent = 'OK'; badge.className = 'card-badge accent-green'; }
    }
  }

  // ---- Panel: Sartor Status ----
  // data from sartor_status event: {cycles_today, last_status, cost_today, cost_limit, tasks_pending, tasks_completed, brief_exists, uptime}

  function updateSartorStatus(data) {
    if (!data) return;

    if (data.cycles_today !== undefined) setVal('cron-cycles', String(data.cycles_today));
    if (data.uptime !== undefined) setVal('sartor-uptime', formatDuration(data.uptime));
    if (data.last_status !== undefined) setVal('last-action', data.last_status);

    // Cost meter
    var costToday = data.cost_today || 0;
    var costLimit = data.cost_limit || 5.0;
    setVal('cost-value', '$' + costToday.toFixed(2) + ' / $' + costLimit.toFixed(2));
    var costBar = document.getElementById('cost-bar');
    if (costBar) costBar.style.width = Math.min(100, (costToday / costLimit) * 100) + '%';

    // Badge
    var badge = document.getElementById('sartor-badge');
    if (badge) {
      if (data.cycles_today > 0) {
        badge.textContent = 'Active';
        badge.className = 'card-badge accent-green';
      } else {
        badge.textContent = 'Idle';
        badge.className = 'card-badge';
      }
    }
  }

  // ---- Panel: Task Board ----
  // data from task_update event or /api/sartor/tasks: {content: "markdown text"}

  function updateTaskBoard(data) {
    var container = document.getElementById('task-list');
    var countBadge = document.getElementById('task-count');
    if (!container) return;

    var content = '';
    if (data && data.content) content = data.content;
    else if (typeof data === 'string') content = data;

    if (!content.trim()) {
      container.innerHTML = '<div class="empty-state">No active tasks</div>';
      if (countBadge) countBadge.textContent = '0 tasks';
      return;
    }

    var tasks = parseMarkdownTasks(content);
    if (countBadge) countBadge.textContent = tasks.length + ' task' + (tasks.length !== 1 ? 's' : '');

    var html = '';
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      var prioClass = '';
      var prio = (t.priority || '').toLowerCase();
      if (prio === 'high' || prio === 'critical') prioClass = ' priority-high';
      else if (prio === 'low') prioClass = ' priority-low';
      else prioClass = ' priority-medium';

      var icon = t.done ? '\u2611' : '\u2610';
      var meta = [t.section, t.priority, t.owner].filter(Boolean).join(' \u00B7 ');

      html += '<div class="task-card' + prioClass + '">';
      html += '<div class="task-card-title">' + icon + ' ' + escapeHtml(t.name) + '</div>';
      if (meta) html += '<div class="task-card-meta">' + escapeHtml(meta) + '</div>';
      if (t.description) html += '<div class="task-card-meta" style="margin-top:4px">' + escapeHtml(t.description) + '</div>';
      html += '</div>';
    }
    container.innerHTML = html || '<div class="empty-state">No active tasks</div>';
  }

  function parseMarkdownTasks(text) {
    if (!text) return [];
    var lines = text.split('\n');
    var tasks = [];
    var current = null;
    var section = '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var secMatch = line.match(/^## (.+)/);
      if (secMatch) { section = secMatch[1].trim(); continue; }

      var taskMatch = line.match(/^- \[([ xX])\]\s+\*\*(.+?)\*\*\s*(?:-\s*(.*))?$/);
      if (taskMatch) {
        if (current) tasks.push(current);
        current = {
          done: taskMatch[1].toLowerCase() === 'x',
          name: taskMatch[2].trim(),
          description: (taskMatch[3] || '').trim(),
          section: section,
          priority: 'Medium',
          owner: ''
        };
        continue;
      }

      if (current) {
        var metaMatch = line.match(/^\s+-\s+(Priority|Owner|Tags|Status|Started):\s*(.+)$/i);
        if (metaMatch) {
          var key = metaMatch[1].toLowerCase();
          var val = metaMatch[2].trim();
          if (key === 'priority') current.priority = val;
          else if (key === 'owner') current.owner = val;
          else if (key === 'status') current.description = val;
        }
      }
    }
    if (current) tasks.push(current);
    return tasks;
  }

  // ---- Panel: Morning Brief ----

  function updateBrief(data) {
    var container = document.getElementById('brief-content');
    var dateBadge = document.getElementById('brief-date');
    if (!container) return;

    if (data && data.content) {
      container.innerHTML = mdToHtml(data.content);
      if (dateBadge) dateBadge.textContent = data.date || '--';
    } else {
      container.innerHTML = '<div class="empty-state">No brief available for today</div>';
      if (dateBadge) dateBadge.textContent = '--';
    }
  }

  // ---- Panel: Activity Log ----

  function addLog(message, level) {
    var container = document.getElementById('log-list');
    if (!container) return;
    var empty = container.querySelector('.empty-state');
    if (empty) empty.remove();

    var entry = document.createElement('div');
    entry.className = 'log-entry' + (level ? ' log-' + level : '');

    var timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = formatTime(new Date());

    var msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = message;

    entry.appendChild(timeSpan);
    entry.appendChild(msgSpan);
    container.insertBefore(entry, container.firstChild);

    logCount++;
    setVal('log-count', String(logCount));

    while (container.children.length > 200) {
      container.removeChild(container.lastChild);
    }
  }

  function updateLog(entry) {
    if (!entry) return;
    addLog(entry.message || entry.msg || String(entry), entry.level || '');
  }

  // ---- Panel: Memory Search Results ----
  // data from search_results event: {query, results: [{file, score, snippet, line_number}]}

  function updateSearchResults(data) {
    var container = document.getElementById('search-results');
    if (!container) return;

    var results = [];
    if (data && data.results) results = data.results;
    else if (Array.isArray(data)) results = data;

    if (!results.length) {
      container.innerHTML = '<div class="empty-state">No results found</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var file = r.file ? r.file.split(/[/\\]/).pop() : (r.key || 'Unknown');
      html += '<div class="search-result-item">';
      html += '<div class="search-result-file">' + escapeHtml(file);
      if (r.score !== undefined) html += '<span class="search-result-score">' + Number(r.score).toFixed(2) + '</span>';
      html += '</div>';
      if (r.snippet || r.content) {
        html += '<div class="search-result-snippet">' + escapeHtml((r.snippet || r.content || '').substring(0, 200)) + '</div>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  // ---- Panel: Calendar ----
  // data from /api/sartor/calendar: [{summary, start, end, location, calendar}] or {status: "not_configured", events: []}

  function updateCalendar(data) {
    var container = document.getElementById('event-list');
    if (!container) return;

    if (data && data.status === 'not_configured') {
      container.innerHTML = '<div class="empty-state">Google Calendar not configured</div>';
      return;
    }

    var events = Array.isArray(data) ? data : (data && data.events ? data.events : []);
    if (!events.length) {
      container.innerHTML = '<div class="empty-state">No upcoming events</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var start = ev.start || '';
      var time = start.includes('T') ? start.split('T')[1].substring(0, 5) : 'All day';
      var day = start.substring(0, 10);
      html += '<div class="event-item">';
      html += '<span class="event-date">' + escapeHtml(day) + '<br>' + escapeHtml(time) + '</span>';
      html += '<span class="event-title">' + escapeHtml(ev.summary || ev.title || '(No title)');
      if (ev.location) html += '<br><small style="color:var(--text-muted)">' + escapeHtml(ev.location) + '</small>';
      html += '</span></div>';
    }
    container.innerHTML = html;
  }

  // ---- Panel: Email ----
  // data from /api/sartor/email: {unread, recent: [{id, subject, from_name, from_email, date, snippet, is_unread}]} or {status: "not_configured"}

  function updateEmail(data) {
    var container = document.getElementById('email-list');
    var badge = document.getElementById('email-badge');
    if (!container) return;

    if (data && data.status === 'not_configured') {
      container.innerHTML = '<div class="empty-state">Gmail not configured</div>';
      if (badge) badge.textContent = '--';
      return;
    }

    var unread = (data && data.unread !== undefined) ? data.unread : 0;
    var recent = (data && data.recent) ? data.recent : [];

    if (badge) {
      badge.textContent = unread + ' unread';
      badge.className = 'card-badge' + (unread > 10 ? ' accent-warn' : unread > 0 ? ' accent-green' : '');
    }

    if (!recent.length) {
      container.innerHTML = '<div class="empty-state">No recent emails</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < recent.length; i++) {
      var msg = recent[i];
      var from = msg.from_name || msg.from_email || msg.from || 'Unknown';
      var unreadStyle = msg.is_unread ? ' style="border-left:3px solid var(--accent)"' : '';
      html += '<div class="email-item"' + unreadStyle + '>';
      html += '<div class="email-from">' + escapeHtml(from);
      if (msg.date) html += '<span class="email-time">' + escapeHtml(timeAgo(msg.date)) + '</span>';
      html += '</div>';
      html += '<div class="email-subject">' + escapeHtml(msg.subject || '(No subject)') + '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  // ---- WebSocket Event Listeners ----

  socket.on('status_update', updateSystemHealth);
  socket.on('sartor_status', updateSartorStatus);
  socket.on('task_update', updateTaskBoard);
  socket.on('log_event', updateLog);
  socket.on('search_results', updateSearchResults);
  socket.on('cron_cycle', function (data) {
    if (data && data.latest) {
      addLog('Cron cycle at ' + (data.latest.time || '?') + ': ' + (data.latest.status || 'unknown'),
        data.latest.status === 'ok' ? 'success' : 'warning');
    }
  });

  // ---- Search (debounced) ----

  var searchTimer = null;
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var query = searchInput.value.trim();
      if (query.length < 2) {
        document.getElementById('search-results').innerHTML =
          '<div class="empty-state">Type to search memory files</div>';
        return;
      }
      searchTimer = setTimeout(function () {
        socket.emit('search_sartor_memory', { query: query });
        document.getElementById('search-results').innerHTML =
          '<div class="empty-state">Searching...</div>';
      }, 300);
    });
  }

  // ---- Initial Data Fetch ----

  function fetchInitialData() {
    fetch('/api/sartor/status').then(function (r) { return r.json(); }).then(updateSartorStatus).catch(function () {});
    fetch('/api/sartor/tasks').then(function (r) { return r.json(); }).then(updateTaskBoard).catch(function () {});
    fetch('/api/brief').then(function (r) { return r.json(); }).then(updateBrief).catch(function () {});
    fetch('/api/sartor/calendar').then(function (r) { return r.json(); }).then(updateCalendar).catch(function () {});
    fetch('/api/sartor/email').then(function (r) { return r.json(); }).then(updateEmail).catch(function () {});
    fetch('/api/log').then(function (r) { return r.json(); }).then(function (entries) {
      if (Array.isArray(entries)) {
        for (var i = entries.length - 1; i >= 0; i--) updateLog(entries[i]);
      }
    }).catch(function () {});
    fetch('/api/sartor/cron-log').then(function (r) { return r.json(); }).then(function (data) {
      if (data && data.cycles && data.cycles.length > 0) {
        var last = data.cycles[data.cycles.length - 1];
        setVal('last-cycle', last.time || '--');
      }
    }).catch(function () {});
  }

  // ---- Footer Clock ----

  function updateClock() {
    var el = document.getElementById('footer-time');
    if (el) el.textContent = new Date().toLocaleString();
  }
  updateClock();
  setInterval(updateClock, 1000);

})();
