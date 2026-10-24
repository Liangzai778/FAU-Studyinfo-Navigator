const endpointInput = document.getElementById('endpoint');
const tokenInput = document.getElementById('token');
const daysSelect = document.getElementById('days');
const form = document.getElementById('config');
const forgetButton = document.getElementById('forget');
const statusLine = document.getElementById('status');
const result = document.getElementById('result');

const endpointKey = 'fau-study-stats.endpoint';
const tokenKey = 'fau-study-stats.token';

endpointInput.value = localStorage.getItem(endpointKey) ?? '';
tokenInput.value = sessionStorage.getItem(tokenKey) ?? '';

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', isError);
}

function textCell(value) {
  const cell = document.createElement('td');
  cell.textContent = String(value);
  return cell;
}

function fillTable(tbody, rows, emptyText, formatter) {
  tbody.replaceChildren();
  if (rows.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 2;
    cell.className = 'empty';
    cell.textContent = emptyText;
    row.append(cell);
    tbody.append(row);
    return;
  }
  for (const item of rows) {
    const row = document.createElement('tr');
    row.append(textCell(formatter(item)));
    const count = textCell(item.count);
    count.className = 'num';
    row.append(count);
    tbody.append(row);
  }
}

function renderChart(daily) {
  const chart = document.getElementById('chart');
  chart.replaceChildren();
  const max = Math.max(1, ...daily.map((day) => Math.max(day.pageViews, day.events)));
  for (const day of daily) {
    const group = document.createElement('div');
    group.className = 'bar-group';
    group.title = `${day.date}: ${day.pageViews} 次访问, ${day.events} 次功能使用`;

    const views = document.createElement('div');
    views.className = 'bar views';
    views.style.height = `${Math.round((day.pageViews / max) * 100)}%`;
    views.setAttribute('aria-label', `${day.date} 页面访问 ${day.pageViews}`);

    const events = document.createElement('div');
    events.className = 'bar events';
    events.style.height = `${Math.round((day.events / max) * 100)}%`;
    events.setAttribute('aria-label', `${day.date} 功能使用 ${day.events}`);

    group.append(views, events);
    chart.append(group);
  }
}

function render(data) {
  document.getElementById('total-views').textContent = String(data.totals.pageViews);
  document.getElementById('total-events').textContent = String(data.totals.events);
  document.getElementById('total-days').textContent = String(data.daily.length);
  document.getElementById('generated-at').textContent = new Date(data.generatedAt).toLocaleString();

  renderChart(data.daily);
  fillTable(document.getElementById('pages'), data.pages.slice(0, 20), '还没有页面访问记录', (item) => item.path);
  fillTable(document.getElementById('events'), data.events.slice(0, 20), '还没有功能使用记录', (item) => item.event);

  result.hidden = false;
}

function demoData(days) {
  const daily = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    daily.push({
      date: iso,
      pageViews: 6 + ((offset * 37) % 23),
      events: 1 + ((offset * 13) % 9),
    });
  }
  return {
    generatedAt: new Date().toISOString(),
    days,
    totals: {
      pageViews: daily.reduce((sum, day) => sum + day.pageViews, 0),
      events: daily.reduce((sum, day) => sum + day.events, 0),
    },
    pages: [
      { path: '/', count: 320 },
      { path: '/degree', count: 214 },
      { path: '/planner', count: 187 },
      { path: '/resources', count: 96 },
      { path: '/legal', count: 14 },
    ],
    events: [
      { event: 'degree_saved', count: 41 },
      { event: 'course_added', count: 36 },
      { event: 'calendar_event_added', count: 22 },
      { event: 'backup_exported', count: 7 },
    ],
    daily,
  };
}

async function load() {
  const endpoint = endpointInput.value.trim().replace(/\/+$/, '');
  const days = Number(daysSelect.value);

  if (new URLSearchParams(window.location.search).has('demo')) {
    render(demoData(days));
    setStatus('当前显示的是演示数据，不会发出任何请求。');
    return;
  }

  if (!endpoint) {
    setStatus('先填写统计服务地址。', true);
    return;
  }

  const token = tokenInput.value.trim();
  if (!token) {
    setStatus('填写 STATS_TOKEN 才能读取统计。', true);
    return;
  }

  try {
    localStorage.setItem(endpointKey, endpoint);
    sessionStorage.setItem(tokenKey, token);
  } catch {
    // Private mode can refuse storage; reading still works.
  }

  setStatus('读取中…');
  try {
    const response = await fetch(`${endpoint}/stats?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      setStatus('令牌不正确。', true);
      return;
    }
    if (!response.ok) {
      setStatus(`统计服务返回 ${response.status}。`, true);
      return;
    }
    render(await response.json());
    setStatus(`已读取最近 ${days} 天的聚合数据。`);
  } catch {
    setStatus('无法连接统计服务，检查地址、网络和 Worker 是否已部署。', true);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void load();
});

forgetButton.addEventListener('click', () => {
  sessionStorage.removeItem(tokenKey);
  tokenInput.value = '';
  setStatus('令牌已从当前标签页清除。');
});

if (new URLSearchParams(window.location.search).has('demo')) {
  void load();
}
