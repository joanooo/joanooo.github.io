/* =========================================
   差假證明產生器邏輯 (Official Leave JS)
   ========================================= */
const DEFAULT_MEMBERS = ['石廷安','許凱睿','魏笠元','吳柏諺','林承翰','陳昭升','李昱緯','戴琮儒','林緯哲','劉顓賢','翁浚哲','鄭仁靖','張珍珠'];
const WEEKDAYS = ['日','一','二','三','四','五','六'];
let zoomLevel = 100;
let currentMode = 'cert';

function initMembers() {
  const grid = document.getElementById('memberGrid');
  grid.innerHTML = DEFAULT_MEMBERS.map(name => `
    <label class="member-checkbox">
      <input type="checkbox" value="${name}" checked>
      ${name}
    </label>
  `).join('');
}

function selectAll(checked) {
  document.querySelectorAll('#memberGrid input[type="checkbox"]')
    .forEach(cb => cb.checked = checked);
}

function getSelectedMembers() {
  return [...document.querySelectorAll('#memberGrid input[type="checkbox"]:checked')]
    .map(cb => cb.value);
}

function formatDate(dateStr) {
  if (!dateStr) return '（未填日期）';
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const wd = WEEKDAYS[d.getDay()];
  return `${y}/${m}/${day}（${wd}）`;
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('tabCert').classList.toggle('active', mode === 'cert');
  document.getElementById('tabIndividual').classList.toggle('active', mode === 'individual');
  document.getElementById('btnPrint').style.display = mode === 'cert' ? '' : 'none';
  document.getElementById('btnCopyAll').style.display = mode === 'individual' ? '' : 'none';
  document.getElementById('zoomControls').style.display = mode === 'cert' ? '' : 'none';
}

function applyZoom() {
  const wrapper = document.getElementById('a4Wrapper');
  const scale = zoomLevel / 100;
  wrapper.style.transform = `scale(${scale})`;
  const a4 = wrapper.querySelector('.a4-page');
  if (a4) wrapper.style.height = (a4.offsetHeight * scale) + 'px';
  document.getElementById('zoomLabel').textContent = zoomLevel + '%';
}

function changeZoom(delta) {
  zoomLevel = Math.min(150, Math.max(40, zoomLevel + delta));
  applyZoom();
}

function resetZoom() {
  zoomLevel = 100;
  applyZoom();
}

function autoZoom() {
  const previewWidth = document.querySelector('.preview-area').offsetWidth - 60;
  if (previewWidth < 794) {
    zoomLevel = Math.max(40, Math.floor((previewWidth / 794) * 100 / 10) * 10);
    document.getElementById('zoomLabel').textContent = zoomLevel + '%';
  }
}

function togglePanel() {
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}

function generate() {
  const projectNo = document.getElementById('projectNo').value.trim() || '（未填）';
  const location  = document.getElementById('location').value.trim()  || '（未填）';
  const task      = document.getElementById('task').value.trim()      || '執行相關工作';
  const tripDate  = document.getElementById('tripDate').value;
  const timeStart = document.getElementById('timeStart').value || '08:00';
  const timeEnd   = document.getElementById('timeEnd').value   || '18:00';
  const members   = getSelectedMembers();

  if (members.length === 0) { alert('請至少勾選一位出差人員！'); return; }

  const memberStr = members.join('、');
  const dateStr   = formatDate(tripDate);

  const html = `
    <div class="a4-page">
      <div class="cert-title">出　差　證　明　書</div>
      <div class="cert-body">
        &emsp;&emsp;為協助校內計畫編號：<span class="hl">${projectNo}</span>，因此派遣學生
        <span class="hl">${memberStr}</span>
        赴<span class="hl">${location}</span><span class="hl">${task}</span>。
        以此證明利出差的學生作為差假申請之用。
      </div>
      <div class="cert-meta">
        <span>日期：<strong>${dateStr}</strong></span>
        <span>時間：<strong>${timeStart}〜${timeEnd}</strong></span>
      </div>
      <div class="cert-sign">
        <span class="dept">電機系</span>&emsp;助理教授&emsp;陳靜茹
      </div>
    </div>
  `;

  document.getElementById('previewContent').innerHTML = html;
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('modeTabs').style.display = 'flex';

  switchMode('cert');
  if (window.innerWidth <= 900) togglePanel();
  setTimeout(() => { autoZoom(); applyZoom(); }, 50);
}

function generateIndividual() {
  const projectNo = document.getElementById('projectNo').value.trim() || '（未填）';
  const location  = document.getElementById('location').value.trim()  || '（未填）';
  const task      = document.getElementById('task').value.trim()      || '執行相關工作';
  const tripDate  = document.getElementById('tripDate').value;
  const members   = getSelectedMembers();

  if (members.length === 0) { alert('請至少勾選一位出差人員！'); return; }

  const dateStr = formatDate(tripDate);

  const cards = members.map((name, i) => {
    const text = `為協助校內計畫編號：${projectNo}，於${dateStr}派遣學生 ${name} 赴${location}${task}。`;
    return `
      <div class="individual-card">
        <div class="individual-card-header">
          <span>👤 ${name}</span>
          <button class="btn-copy" id="copyBtn${i}" onclick="copySingle(${i}, '${escapeJs(text)}')">複製</button>
        </div>
        <div class="individual-card-body">
          <div class="individual-text" id="indText${i}">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
  }).join('');

  const wrapper = `<div class="individual-container">${cards}</div>`;
  const a4Wrapper = document.getElementById('a4Wrapper');
  a4Wrapper.style.transform = 'none';
  a4Wrapper.style.height = 'auto';
  a4Wrapper.style.width = '100%';
  document.getElementById('previewContent').innerHTML = wrapper;

  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('modeTabs').style.display = 'flex';

  switchMode('individual');
  if (window.innerWidth <= 900) togglePanel();
}

function copySingle(i, text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copyBtn${i}`);
    btn.textContent = '✅ 已複製';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '複製'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const btn = document.getElementById(`copyBtn${i}`);
    btn.textContent = '✅ 已複製'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '複製'; btn.classList.remove('copied'); }, 2000);
  });
}

function copyAll() {
  const texts = [...document.querySelectorAll('.individual-text')]
    .map(el => el.textContent.trim()).join('\n\n');

  navigator.clipboard.writeText(texts).then(() => {
    const btn = document.getElementById('btnCopyAll');
    btn.textContent = '✅ 全部已複製'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 複製全部文字'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = texts; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const btn = document.getElementById('btnCopyAll');
    btn.textContent = '✅ 全部已複製'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 複製全部文字'; btn.classList.remove('copied'); }, 2000);
  });
}

function escapeHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeJs(str) { return str.replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

window.addEventListener('resize', () => {
  if (currentMode === 'cert' && document.querySelector('.a4-page')) autoZoom();
});

initMembers();
