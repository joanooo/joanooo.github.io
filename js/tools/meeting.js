/* =========================================
   會議記錄產生器邏輯 (Meeting JS)
   ========================================= */
let zoomLevel = 100;

// ✅ 完整成員名單
const DEFAULT_MEMBERS = [
  { name: '石廷安', role: '研究生' },
  { name: '許凱睿', role: '研究生' },
  { name: '魏笠元', role: '研究生' },
  { name: '吳柏諺', role: '研究生' },
  { name: '林承翰', role: '研究生' },
  { name: '陳昭升', role: '研究生' },
  { name: '李昱緯', role: '研究生' },
  { name: '戴琮儒', role: '研究生' },
  { name: '林緯哲', role: '研究生' },
  { name: '劉顓賢', role: '研究生' },
  { name: '翁浚哲', role: '研究生' },
  { name: '鄭仁靖', role: '研究生' },
  { name: '張珍珠', role: '專題生' },
];

const ROLES = ['研究生','專題生','博士生','助理教授','教授','助理','訪問學者','其他'];
const AGENDA_TYPES = ['報告事項','討論事項','審查事項','裁示事項','提案'];
const WEEKDAYS = ['日','一','二','三','四','五','六'];

function init() {
  DEFAULT_MEMBERS.forEach(a => addAttendee(a.name, a.role));
  addAgenda('計畫進度報告', '報告事項', '各組報告本週研究進度及遭遇問題。', '請各組於下週前提交進度報告書。');
  addAgenda('感測器安裝規劃', '討論事項', '討論嘉義現地感測器安裝時程與人員分配。', '由石廷安負責協調，預計3/30前完成安裝。');
}

let attendeeCount = 0;
function addAttendee(name = '', role = '研究生') {
  attendeeCount++;
  const id = 'att_' + attendeeCount;
  const roleOptions = ROLES.map(r => `<option value="${r}" ${r===role?'selected':''}>${r}</option>`).join('');
  const html = `
    <div class="attendee-item" id="${id}">
      <input type="text" value="${name}" placeholder="姓名">
      <select>${roleOptions}</select>
      <button class="btn-icon btn-del-row" onclick="removeRow('${id}')">✕</button>
    </div>`;
  document.getElementById('attendeeList').insertAdjacentHTML('beforeend', html);
}

let agendaCount = 0;
function addAgenda(title='', type='報告事項', content='', resolution='') {
  agendaCount++;
  const id = 'ag_' + agendaCount;
  const num = document.querySelectorAll('.agenda-item').length + 1;
  const typeOptions = AGENDA_TYPES.map(t => `<option value="${t}" ${t===type?'selected':''}>${t}</option>`).join('');
  const html = `
    <div class="agenda-item" id="${id}">
      <div class="agenda-header">
        <span class="agenda-num">議題 ${num}</span>
        <button class="btn-icon btn-del-row" onclick="removeRow('${id}');reNumberAgenda()">✕</button>
      </div>
      <div class="form-group"><label>議題標題</label><input type="text" value="${escJs(title)}" placeholder="例：計畫進度報告"></div>
      <div class="form-group"><label>類型</label><select>${typeOptions}</select></div>
      <div class="form-group"><label>說明 / 內容</label><textarea placeholder="議題說明、討論內容…">${escJs(content)}</textarea></div>
      <div class="form-group"><label>決議（可留空）</label><textarea placeholder="決議事項…">${escJs(resolution)}</textarea></div>
    </div>`;
  document.getElementById('agendaList').insertAdjacentHTML('beforeend', html);
}

function removeRow(id) { const el = document.getElementById(id); if (el) el.remove(); }
function reNumberAgenda() {
  document.querySelectorAll('.agenda-item .agenda-num').forEach((el, i) => { el.textContent = `議題 ${i+1}`; });
}

function formatDate(dateStr) {
  if (!dateStr) return '（未填）';
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y} 年 ${m} 月 ${day} 日（${WEEKDAYS[d.getDay()]}）`;
}

function generate() {
  const org      = v('orgName')      || '（未填）';
  const name     = v('meetingName')  || '會議';
  const session  = v('meetingSession');
  const date     = formatDate(document.getElementById('meetingDate').value);
  const time     = v('meetingTime')  || '（未填）';
  const place    = v('meetingPlace') || '（未填）';
  const chair    = v('chairperson')  || '（未填）';
  const recorder = v('recorder')    || '（未填）';
  const misc     = v('miscMotion');

  const attendees = [...document.querySelectorAll('#attendeeList .attendee-item')].map(item => {
    const inputs = item.querySelectorAll('input, select');
    return { name: inputs[0].value.trim(), role: inputs[1].value };
  }).filter(a => a.name);

  const agendas = [...document.querySelectorAll('#agendaList .agenda-item')].map((item, i) => {
    const inputs = item.querySelectorAll('input, select, textarea');
    return { num: i+1, title: inputs[0].value.trim() || `議題 ${i+1}`, type: inputs[1].value, content: inputs[2].value.trim(), resolution: inputs[3].value.trim() };
  });

  // 依身份分組
  const roleOrder = ['教授','助理教授','博士生','研究生','專題生','助理','訪問學者','其他'];
  const grouped = {};
  attendees.forEach(a => {
    if (!grouped[a.role]) grouped[a.role] = [];
    grouped[a.role].push(a.name);
  });

  const attendeeHTML = roleOrder
    .filter(r => grouped[r] && grouped[r].length > 0)
    .map(r => {
      const cells = grouped[r].map(n => `<div class="attendee-cell">${escHtml(n)}</div>`).join('');
      const tagClass = 'tag-' + r;
      return `
        <div class="role-group">
          <span class="role-group-label ${tagClass}">${r}（${grouped[r].length} 人）</span>
          <div class="attendee-grid">${cells}</div>
        </div>`;
    }).join('');

  const agendaBlocks = agendas.map(ag => `
    <div class="agenda-block">
      <div class="agenda-block-header">
        <span class="agenda-block-num">第 ${ag.num} 案</span>
        <span class="agenda-block-title">${escHtml(ag.title)}</span>
        <span class="agenda-block-type">${ag.type}</span>
      </div>
      <div class="agenda-block-body">
        ${ag.content ? `<div class="field-label">說明：</div><div class="field-content">${escHtml(ag.content)}</div>` : ''}
        ${ag.resolution
          ? `<div class="resolution-box">${escHtml(ag.resolution)}</div>`
          : '<div style="font-size:13px;color:#94a3b8;margin-top:6px;">（本案無決議）</div>'}
      </div>
    </div>`).join('');

  const sessionStr = session ? `　${session}` : '';
  const titleFull = `${name}${sessionStr}　會議記錄`;

  document.getElementById('previewContent').innerHTML = `
    <div class="a4-page">
      <div class="doc-header">
        <div class="doc-org">${escHtml(org)}</div>
        <div class="doc-title">${escHtml(name)}</div>
        ${session ? `<div class="doc-subtitle">${escHtml(session)}</div>` : ''}
      </div>
      <hr class="doc-divider">
      <table class="info-table">
        <tr><td>會議名稱</td><td>${escHtml(titleFull)}</td></tr>
        <tr><td>日　　期</td><td>${date}</td></tr>
        <tr><td>時　　間</td><td>${escHtml(time)}</td></tr>
        <tr><td>地　　點</td><td>${escHtml(place)}</td></tr>
        <tr><td>主　　席</td><td>${escHtml(chair)}</td></tr>
        <tr><td>記　　錄</td><td>${escHtml(recorder)}</td></tr>
        <tr><td>出席人數</td><td>${attendees.length} 人</td></tr>
      </table>
      ${attendees.length > 0 ? `
      <div class="attendee-section">
        <div class="attendee-section-title">出席人員名單</div>
        ${attendeeHTML}
      </div>` : ''}
      <hr class="doc-divider-thin">
      ${agendas.length > 0 ? `
      <div class="agenda-section">
        <div class="agenda-section-title">議　　程</div>
        ${agendaBlocks}
      </div>` : ''}
      <div class="agenda-section">
        <div class="agenda-section-title">臨時動議</div>
        <div class="misc-section">${misc ? escHtml(misc) : '無'}</div>
      </div>
      <div class="sign-section">
        <div class="sign-box"><div class="sign-title">主　席</div><div class="sign-name">${escHtml(chair)}</div></div>
        <div class="sign-box"><div class="sign-title">記　錄</div><div class="sign-name">${escHtml(recorder)}</div></div>
        <div class="sign-box"><div class="sign-title">單位主管</div><div class="sign-name"></div></div>
      </div>
      <div class="doc-footer">${escHtml(org)}　${escHtml(titleFull)}　${date}</div>
    </div>`;

  document.getElementById('toolbar').style.display = 'flex';
  if (window.innerWidth <= 900) togglePanel();
  setTimeout(() => { autoZoom(); applyZoom(); }, 50);
}

function copyText() {
  const org      = v('orgName') || '';
  const name     = v('meetingName') || '會議';
  const session  = v('meetingSession');
  const date     = formatDate(document.getElementById('meetingDate').value);
  const time     = v('meetingTime') || '';
  const place    = v('meetingPlace') || '';
  const chair    = v('chairperson') || '';
  const recorder = v('recorder') || '';
  const misc     = v('miscMotion');

  const attendees = [...document.querySelectorAll('#attendeeList .attendee-item')].map(item => {
    const inputs = item.querySelectorAll('input, select');
    return `${inputs[0].value.trim()}（${inputs[1].value}）`;
  }).filter(Boolean);

  const agendas = [...document.querySelectorAll('#agendaList .agenda-item')].map((item, i) => {
    const inputs = item.querySelectorAll('input, select, textarea');
    const title = inputs[0].value.trim() || `議題 ${i+1}`;
    const type = inputs[1].value;
    const content = inputs[2].value.trim();
    const resolution = inputs[3].value.trim();
    let block = `【第 ${i+1} 案】${title}（${type}）\n`;
    if (content) block += `說明：${content}\n`;
    block += resolution ? `決議：${resolution}` : '決議：（無）';
    return block;
  });

  const sessionStr = session ? `　${session}` : '';
  let text = `${org}\n${name}${sessionStr}　會議記錄\n`;
  text += '═'.repeat(40) + '\n';
  text += `日期：${date}\n時間：${time}\n地點：${place}\n主席：${chair}\n記錄：${recorder}\n`;
  text += `出席（${attendees.length}人）：${attendees.join('、')}\n`;
  text += '─'.repeat(40) + '\n';
  text += '【議程】\n' + agendas.join('\n\n') + '\n';
  text += '─'.repeat(40) + '\n';
  text += `【臨時動議】\n${misc || '無'}\n`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopyText');
    btn.textContent = '✅ 已複製';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 複製純文字'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => alert('複製失敗，請手動複製'));
}

function applyZoom() {
  const wrapper = document.getElementById('a4Wrapper');
  const scale = zoomLevel / 100;
  wrapper.style.transform = `scale(${scale})`;
  const page = wrapper.querySelector('.a4-page');
  if (page) wrapper.style.height = (page.offsetHeight * scale) + 'px';
  document.getElementById('zoomLabel').textContent = zoomLevel + '%';
}
function changeZoom(d) { zoomLevel = Math.min(150, Math.max(40, zoomLevel + d)); applyZoom(); }
function resetZoom() { zoomLevel = 100; applyZoom(); }
function autoZoom() {
  const pw = document.querySelector('.preview-area').offsetWidth - 60;
  if (pw < 794) zoomLevel = Math.max(40, Math.floor((pw / 794) * 100 / 10) * 10);
}
function togglePanel() {
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}
function v(id) { return document.getElementById(id).value.trim(); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
function escJs(s) { return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

window.addEventListener('resize', () => {
  if (document.querySelector('.a4-page')) { autoZoom(); applyZoom(); }
});

init();
