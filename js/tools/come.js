/* =========================================
   出勤紀錄系統邏輯 (Attendance JS)
   ========================================= */
const ROLE_ORDER = ['教授','博士生','研究生','專題生','助理','其他'];

let members = [
  { id:1,  name:'石廷安', role:'研究生' },
  { id:2,  name:'許凱睿', role:'研究生' },
  { id:3,  name:'魏笠元', role:'研究生' },
  { id:4,  name:'吳柏諺', role:'研究生' },
  { id:5,  name:'林承翰', role:'研究生' },
  { id:6,  name:'陳昭升', role:'研究生' },
  { id:7,  name:'李昱緯', role:'研究生' },
  { id:8,  name:'戴琮儒', role:'研究生' },
  { id:9,  name:'林緯哲', role:'研究生' },
  { id:10, name:'劉顓賢', role:'研究生' },
  { id:11, name:'翁浚哲', role:'研究生' },
  { id:12, name:'鄭仁靖', role:'專題生' },
  { id:13, name:'張珍珠', role:'專題生' },
];

let currentSession = {};   // { memberId: { status, time } }
let sessions = [];         // 歷史紀錄
let nextId = 14;

const STATUS_CYCLE = ['none','present','late','absent'];
const STATUS_LABEL = { none:'未簽到', present:'出席', late:'遲到', absent:'缺席' };
const STATUS_ICON  = { none:'—', present:'✅', late:'⏰', absent:'❌' };

function init() {
  const today = new Date();
  document.getElementById('todayDate').value = today.toISOString().slice(0,10);
  document.getElementById('meetingLabel').value = '研究室週會';
  newSession();
  renderMemberList();
  updateClock();
  setInterval(updateClock, 1000);
  loadSampleHistory();
  renderHistory();
  renderStats();
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('zh-TW', { hour12: false });
}

// ── 簽到 ──
function newSession() {
  currentSession = {};
  members.forEach(m => { currentSession[m.id] = { status: 'none', time: '' }; });
  renderCheckin();
  updateCheckinStats();
}

function renderCheckin() {
  const grid = document.getElementById('checkinGrid');
  const sorted = [...members].sort((a,b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  grid.innerHTML = sorted.map(m => {
    const s = currentSession[m.id] || { status:'none', time:'' };
    const initial = m.name.charAt(0);
    return `
      <div class="member-card ${s.status !== 'none' ? s.status : ''}" id="mc-${m.id}" onclick="toggleStatus(${m.id})">
        <div class="status-badge badge-${s.status === 'none' ? 'none' : s.status}"></div>
        <div class="member-avatar">${initial}</div>
        <div class="member-name">${m.name}</div>
        <div class="member-role"><span class="role-tag role-${m.role}">${m.role}</span></div>
        <div class="member-status c-${s.status === 'present' ? 'green' : s.status === 'late' ? 'yellow' : s.status === 'absent' ? 'red' : 'gray'}">
          ${STATUS_ICON[s.status]} ${STATUS_LABEL[s.status]}
        </div>
        ${s.time ? `<div class="member-time">${s.time}</div>` : ''}
      </div>`;
  }).join('');
}

function toggleStatus(id) {
  const cur = currentSession[id].status;
  const idx = STATUS_CYCLE.indexOf(cur);
  const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  const time = next === 'none' ? '' : new Date().toLocaleTimeString('zh-TW', { hour12: false });
  currentSession[id] = { status: next, time };
  renderCheckin();
  updateCheckinStats();
}

function setAll(status) {
  members.forEach(m => {
    const time = status === 'none' ? '' : new Date().toLocaleTimeString('zh-TW', { hour12: false });
    currentSession[m.id] = { status, time };
  });
  renderCheckin();
  updateCheckinStats();
}

function updateCheckinStats() {
  const vals = Object.values(currentSession);
  document.getElementById('s-total').textContent   = members.length;
  document.getElementById('s-present').textContent = vals.filter(v => v.status === 'present').length;
  document.getElementById('s-absent').textContent  = vals.filter(v => v.status === 'absent').length;
  document.getElementById('s-late').textContent    = vals.filter(v => v.status === 'late').length;
}

function saveSession() {
  const date  = document.getElementById('todayDate').value || new Date().toISOString().slice(0,10);
  const label = document.getElementById('meetingLabel').value || '會議';
  const snap  = {};
  Object.keys(currentSession).forEach(k => { snap[k] = { ...currentSession[k] }; });
  sessions.unshift({ id: Date.now(), date, label, data: snap });
  renderHistory();
  renderStats();
  showToast('✅ 出勤紀錄已儲存！');
}

// ── 歷史 ──
function loadSampleHistory() {
  const dates = ['2026-03-20','2026-03-13','2026-03-06'];
  const labels = ['研究室週會','研究室週會','研究室週會'];
  dates.forEach((d, di) => {
    const snap = {};
    members.forEach(m => {
      const r = Math.random();
      const status = r < 0.75 ? 'present' : r < 0.88 ? 'late' : 'absent';
      snap[m.id] = { status, time: status !== 'absent' ? '14:0' + (di*2+Math.floor(Math.random()*5)) : '' };
    });
    sessions.push({ id: Date.now() - di * 86400000, date: d, label: labels[di], data: snap });
  });
}

function renderHistory() {
  const el = document.getElementById('historyList');
  if (!sessions.length) { el.innerHTML = '<div class="empty">尚無歷史紀錄</div>'; return; }
  el.innerHTML = sessions.map(s => {
    const vals = Object.values(s.data);
    const p = vals.filter(v => v.status === 'present').length;
    const a = vals.filter(v => v.status === 'absent').length;
    const l = vals.filter(v => v.status === 'late').length;
    return `
      <div class="history-item" onclick="showHistoryDetail(${s.id})">
        <div class="history-date">${s.date}</div>
        <div class="history-label">${s.label}</div>
        <div class="history-badges">
          <span class="hbadge hbadge-p">出席 ${p}</span>
          <span class="hbadge hbadge-l">遲到 ${l}</span>
          <span class="hbadge hbadge-a">缺席 ${a}</span>
        </div>
        <button class="history-del" onclick="event.stopPropagation();deleteSession(${s.id})">🗑</button>
      </div>`;
  }).join('');
}

function showHistoryDetail(sid) {
  const s = sessions.find(x => x.id === sid);
  if (!s) return;
  document.getElementById('historyDetail').style.display = 'block';
  document.getElementById('historyDetailTitle').textContent = `📋 ${s.date} ${s.label} 詳細紀錄`;
  const tbody = document.getElementById('historyDetailBody');
  tbody.innerHTML = members.map(m => {
    const d = s.data[m.id] || { status:'none', time:'' };
    const colorClass = d.status === 'present' ? 'c-green' : d.status === 'late' ? 'c-yellow' : d.status === 'absent' ? 'c-red' : '';
    return `<tr>
      <td class="name-cell">${m.name}</td>
      <td><span class="role-tag role-${m.role}">${m.role}</span></td>
      <td class="${colorClass}" style="font-weight:bold;">${STATUS_ICON[d.status]} ${STATUS_LABEL[d.status]}</td>
      <td style="color:var(--text2);">${d.time || '—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('historyDetail').scrollIntoView({ behavior:'smooth' });
}

function deleteSession(sid) {
  if (!confirm('確定刪除此筆紀錄？')) return;
  sessions = sessions.filter(s => s.id !== sid);
  renderHistory();
  renderStats();
  document.getElementById('historyDetail').style.display = 'none';
  showToast('🗑 已刪除紀錄');
}

// ── 統計 ──
function renderStats() {
  document.getElementById('st-sessions').textContent = sessions.length;
  document.getElementById('st-members').textContent  = members.length;

  if (!sessions.length) {
    document.getElementById('statsBody').innerHTML = '<tr><td colspan="7" class="empty">尚無紀錄</td></tr>';
    document.getElementById('st-avgRate').textContent = '0%';
    document.getElementById('st-lowCount').textContent = '0';
    document.getElementById('sessionChart').innerHTML = '<div class="empty" style="width:100%;">尚無場次資料</div>';
    return;
  }

  let totalRate = 0, lowCount = 0;
  const tbody = document.getElementById('statsBody');
  tbody.innerHTML = members.map(m => {
    let p=0, a=0, l=0, n=0;
    sessions.forEach(s => {
      const d = s.data[m.id];
      if (!d || d.status === 'none') n++;
      else if (d.status === 'present') p++;
      else if (d.status === 'absent')  a++;
      else if (d.status === 'late')    l++;
    });
    const total = sessions.length;
    const rate = total > 0 ? Math.round((p + l) / total * 100) : 0;
    totalRate += rate;
    if (rate < 70) lowCount++;
    const barClass = rate >= 80 ? 'bar-high' : rate >= 60 ? 'bar-mid' : 'bar-low';
    const rateColor = rate >= 80 ? 'c-green' : rate >= 60 ? 'c-yellow' : 'c-red';
    return `<tr>
      <td class="name-cell">${m.name}</td>
      <td><span class="role-tag role-${m.role}">${m.role}</span></td>
      <td class="c-green">${p}</td>
      <td class="c-yellow">${l}</td>
      <td class="c-red">${a}</td>
      <td style="color:var(--text3);">${n}</td>
      <td>
        <div class="rate-bar">
          <div class="bar-bg"><div class="bar-fill ${barClass}" style="width:${rate}%"></div></div>
          <span class="rate-text ${rateColor}">${rate}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const avgRate = Math.round(totalRate / members.length);
  document.getElementById('st-avgRate').textContent = avgRate + '%';
  document.getElementById('st-lowCount').textContent = lowCount;

  // 場次圖表
  const chartEl = document.getElementById('sessionChart');
  const recent = [...sessions].reverse().slice(-10);
  const maxP = Math.max(...recent.map(s => {
    const vals = Object.values(s.data);
    return vals.filter(v => v.status === 'present' || v.status === 'late').length;
  }), 1);
  chartEl.innerHTML = recent.map(s => {
    const vals = Object.values(s.data);
    const p = vals.filter(v => v.status === 'present' || v.status === 'late').length;
    const pct = Math.round(p / members.length * 100);
    const h = Math.max(8, Math.round(p / maxP * 64));
    const barClass = pct >= 80 ? 'bar-high' : pct >= 60 ? 'bar-mid' : 'bar-low';
    const shortDate = s.date.slice(5);
    return `
      <div class="week-bar-wrap" title="${s.date} ${s.label}：出席率 ${pct}%">
        <div class="week-bar-val">${pct}%</div>
        <div class="week-bar ${barClass}" style="height:${h}px;"></div>
        <div class="week-bar-label">${shortDate}</div>
      </div>`;
  }).join('');
}

// ── 成員管理 ──
function renderMemberList() {
  document.getElementById('memberCount').textContent = members.length;
  const sorted = [...members].sort((a,b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  document.getElementById('memberList').innerHTML = sorted.map(m => `
    <div class="member-row">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${m.name.charAt(0)}</div>
      <input type="text" value="${m.name}" onchange="updateMember(${m.id},'name',this.value)" style="flex:1;">
      <select onchange="updateMember(${m.id},'role',this.value)" style="width:100px;">
        ${['研究生','專題生','博士生','教授','助理','其他'].map(r => `<option ${r===m.role?'selected':''}>${r}</option>`).join('')}
      </select>
      <button class="btn-primary btn-danger" onclick="deleteMember(${m.id})" style="padding:7px 12px;font-size:13px;">✕</button>
    </div>`).join('');
}

function addMember() {
  const name = document.getElementById('newName').value.trim();
  const role = document.getElementById('newRole').value;
  if (!name) { showToast('⚠️ 請輸入姓名'); return; }
  if (members.find(m => m.name === name)) { showToast('⚠️ 姓名重複'); return; }
  members.push({ id: nextId++, name, role });
  currentSession[nextId-1] = { status:'none', time:'' };
  document.getElementById('newName').value = '';
  renderMemberList();
  renderCheckin();
  updateCheckinStats();
  showToast(`✅ 已新增 ${name}`);
}

function updateMember(id, field, val) {
  const m = members.find(x => x.id === id);
  if (m) { m[field] = val; renderCheckin(); renderMemberList(); }
}

function deleteMember(id) {
  const m = members.find(x => x.id === id);
  if (!confirm(`確定移除「${m?.name}」？`)) return;
  members = members.filter(x => x.id !== id);
  delete currentSession[id];
  renderMemberList();
  renderCheckin();
  updateCheckinStats();
  showToast('🗑 已移除成員');
}

// ── 頁籤 ──
function switchTab(tab, event) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  if (event) event.target.classList.add('active');
  if (tab === 'stats') renderStats();
  if (tab === 'history') renderHistory();
  if (tab === 'members') renderMemberList();
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

init();
