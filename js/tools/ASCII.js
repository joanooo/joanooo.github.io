/* =========================================
   ASCII 藝術產生器邏輯 (ASCII JS)
   ========================================= */
const CHARSETS = [
  { id:'standard', name:'標準',   chars:' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$' },
  { id:'simple',   name:'簡單',   chars:' .:-=+*#%@' },
  { id:'blocks',   name:'方塊',   chars:' ░▒▓█' },
  { id:'binary',   name:'二進位', chars:' 01' },
  { id:'braille',  name:'點字',   chars:' ⠁⠃⠇⠏⠟⠿' },
  { id:'dense',    name:'密集',   chars:' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { id:'minimal',  name:'極簡',   chars:' .-+#' },
  { id:'dots',     name:'圓點',   chars:' ·∙•◦○◎●' },
];

const COLOR_MODES = [
  { id:'white', label:'白色',  style:'color:#e6edf3' },
  { id:'green', label:'綠色',  style:'color:#3fb950' },
  { id:'amber', label:'琥珀',  style:'color:#d29922' },
  { id:'cyan',  label:'青色',  style:'color:#39c5cf' },
  { id:'pink',  label:'粉色',  style:'color:#f778ba' },
  { id:'rgb',   label:'彩色',  style:'color:inherit' },
];

let currentCharset = 'standard';
let currentColor   = 'white';
let isInverted     = false;
let sourceImage    = null;
let lastASCII      = '';
let lastRGBData    = null;

// ── 初始化 ──
function init() {
  document.getElementById('charsetGrid').innerHTML = CHARSETS.map(c => `
    <div class="charset-btn ${c.id==='standard'?'active':''}" onclick="selectCharset('${c.id}')" id="cs-${c.id}">
      <div>${c.name}</div>
      <div class="charset-preview">${c.chars.slice(0,16)}</div>
    </div>`).join('');

  document.getElementById('colorGrid').innerHTML = COLOR_MODES.map(c => `
    <div class="color-btn ${c.id==='white'?'active':''}" onclick="selectColor('${c.id}')" id="cm-${c.id}" style="${c.style};background:var(--bg);border-color:var(--border);">
      ${c.label}
    </div>`).join('');
}

function selectCharset(id) {
  currentCharset = id;
  document.querySelectorAll('.charset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cs-' + id)?.classList.add('active');
}

function selectColor(id) {
  currentColor = id;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cm-' + id)?.classList.add('active');
  if (lastASCII) applyColorMode();
}

function applyColorMode() {
  const out = document.getElementById('asciiOutput');
  out.className = 'color-' + currentColor;
  if (currentColor === 'rgb' && lastRGBData) {
    renderRGB(lastRGBData);
  } else {
    out.innerHTML = '';
    out.textContent = lastASCII;
  }
}

function toggleInvert() {
  isInverted = !isInverted;
  const btn = document.getElementById('invertBtn');
  btn.classList.toggle('on', isInverted);
  btn.textContent = isInverted ? '✅ 已反轉' : '反轉';
  if (sourceImage) generateASCII();
}

// ── 圖片載入 ──
function loadImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      document.getElementById('previewThumb').src = ev.target.result;
      document.getElementById('previewThumb').style.display = 'block';
      document.getElementById('generateBtn').disabled = false;
      showToast('✅ 圖片已載入，點擊「產生」開始轉換');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage({ target: { files: [file] } });
  }
}

// ── 核心：圖片 → ASCII ──
function generateASCII() {
  if (!sourceImage) { showToast('⚠️ 請先上傳圖片'); return; }

  const width      = parseInt(document.getElementById('widthRange').value);
  const contrast   = parseFloat(document.getElementById('contrastRange').value);
  const brightness = parseFloat(document.getElementById('brightnessRange').value);
  const ratio      = parseFloat(document.getElementById('ratioRange').value);

  let chars = CHARSETS.find(c => c.id === currentCharset)?.chars || CHARSETS[0].chars;
  const custom = document.getElementById('customCharset').value;
  if (custom.trim()) chars = custom;
  if (isInverted) chars = chars.split('').reverse().join('');

  const height = Math.round(sourceImage.height / sourceImage.width * width * ratio);

  const canvas = document.getElementById('workCanvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.filter = `contrast(${contrast}) brightness(${brightness})`;
  ctx.drawImage(sourceImage, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let ascii = '';
  const rgbRows = [];

  for (let y = 0; y < height; y++) {
    let row = '';
    const rgbRow = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const lum = 0.299*r + 0.587*g + 0.114*b;
      const charIdx = Math.floor(lum / 255 * (chars.length - 1));
      row += chars[charIdx];
      rgbRow.push([r, g, b]);
    }
    ascii += row + '\n';
    rgbRows.push(rgbRow);
  }

  lastASCII = ascii;
  lastRGBData = { rows: rgbRows, width, height };

  const out = document.getElementById('asciiOutput');
  const fontSize = Math.max(4, Math.min(10, Math.floor(900 / width)));
  out.style.fontSize = fontSize + 'px';
  out.style.display = 'block';
  document.getElementById('placeholderMsg').style.display = 'none';

  if (currentColor === 'rgb') {
    renderRGB(lastRGBData);
  } else {
    out.className = 'color-' + currentColor;
    out.innerHTML = '';
    out.textContent = ascii;
  }

  document.getElementById('outputInfo').textContent =
    `${width} × ${height} 字元　共 ${ascii.length.toLocaleString()} 字元`;
  showToast('✅ ASCII 藝術產生完成！');
}

function renderRGB({ rows }) {
  const out = document.getElementById('asciiOutput');
  out.className = 'color-rgb';
  const lines = lastASCII.split('\n');
  let html = '';
  rows.forEach((row, y) => {
    const line = lines[y] || '';
    for (let x = 0; x < row.length; x++) {
      const [r,g,b] = row[x];
      const ch = line[x] || ' ';
      const safe = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
      html += `<span style="color:rgb(${r},${g},${b})">${safe}</span>`;
    }
    html += '\n';
  });
  out.innerHTML = html;
}

// ── 文字轉大字 ──
const FONT_BLOCK = {
  'A':['  █  ','  █  ',' █ █ ','█████','█   █'],
  'B':['████ ','█   █','████ ','█   █','████ '],
  'C':[' ████','█    ','█    ','█    ',' ████'],
  'D':['████ ','█   █','█   █','█   █','████ '],
  'E':['█████','█    ','████ ','█    ','█████'],
  'F':['█████','█    ','████ ','█    ','█    '],
  'G':[' ████','█    ','█  ██','█   █',' ████'],
  'H':['█   █','█   █','█████','█   █','█   █'],
  'I':['█████','  █  ','  █  ','  █  ','█████'],
  'J':['█████','   █ ','   █ ','█  █ ',' ██  '],
  'K':['█   █','█  █ ','███  ','█  █ ','█   █'],
  'L':['█    ','█    ','█    ','█    ','█████'],
  'M':['█   █','██ ██','█ █ █','█   █','█   █'],
  'N':['█   █','██  █','█ █ █','█  ██','█   █'],
  'O':[' ███ ','█   █','█   █','█   █',' ███ '],
  'P':['████ ','█   █','████ ','█    ','█    '],
  'Q':[' ███ ','█   █','█ █ █','█  ██',' ████'],
  'R':['████ ','█   █','████ ','█  █ ','█   █'],
  'S':[' ████','█    ',' ███ ','    █','████ '],
  'T':['█████','  █  ','  █  ','  █  ','  █  '],
  'U':['█   █','█   █','█   █','█   █',' ███ '],
  'V':['█   █','█   █','█   █',' █ █ ','  █  '],
  'W':['█   █','█   █','█ █ █','██ ██','█   █'],
  'X':['█   █',' █ █ ','  █  ',' █ █ ','█   █'],
  'Y':['█   █',' █ █ ','  █  ','  █  ','  █  '],
  'Z':['█████','   █ ','  █  ',' █   ','█████'],
  '0':[' ███ ','█  ██','█ █ █','██  █',' ███ '],
  '1':['  █  ',' ██  ','  █  ','  █  ','█████'],
  '2':[' ███ ','█   █','  ██ ',' █   ','█████'],
  '3':['████ ','    █','  ██ ','    █','████ '],
  '4':['█   █','█   █','█████','    █','    █'],
  '5':['█████','█    ','████ ','    █','████ '],
  '6':[' ███ ','█    ','████ ','█   █',' ███ '],
  '7':['█████','    █','   █ ','  █  ','  █  '],
  '8':[' ███ ','█   █',' ███ ','█   █',' ███ '],
  '9':[' ███ ','█   █',' ████','    █',' ███ '],
  '!':['  █  ','  █  ','  █  ','     ','  █  '],
  '?':[' ███ ','█   █','  ██ ','     ','  █  '],
  ' ':['     ','     ','     ','     ','     '],
  '.':['     ','     ','     ','     ','  █  '],
  ',':['     ','     ','     ','  █  ',' █   '],
  '-':['     ','     ','█████','     ','     '],
  '+':['     ','  █  ','█████','  █  ','     '],
};

function renderText() {
  const text = (document.getElementById('textInput').value || 'HELLO').toUpperCase();
  const style = document.getElementById('fontStyle').value;
  const lines = ['','','','',''];
  for (const ch of text) {
    const glyph = FONT_BLOCK[ch] || FONT_BLOCK[' '];
    glyph.forEach((row, i) => {
      let r = row;
      if (style === 'shadow')  r = r.replace(/█/g,'▓');
      else if (style === 'outline') r = r.replace(/█/g,'□');
      else if (style === 'slim')    r = r.replace(/█/g,'|');
      lines[i] += r + ' ';
    });
  }
  lastASCII = lines.join('\n');
  const out = document.getElementById('asciiOutput');
  out.style.fontSize = '14px';
  out.style.display = 'block';
  out.className = 'color-' + currentColor;
  out.innerHTML = '';
  out.textContent = lastASCII;
  document.getElementById('placeholderMsg').style.display = 'none';
  document.getElementById('outputInfo').textContent = `文字 ASCII 藝術：「${text}」`;
  showToast('✅ 文字 ASCII 產生完成！');
}

// ── 複製 ──
function copyASCII() {
  if (!lastASCII) { showToast('⚠️ 尚未產生內容'); return; }
  navigator.clipboard.writeText(lastASCII).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✅ 已複製';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 複製'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── 下載 TXT ──
function downloadTXT() {
  if (!lastASCII) { showToast('⚠️ 尚未產生內容'); return; }
  const blob = new Blob([lastASCII], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ascii-art.txt'; a.click();
  showToast('⬇️ 已下載 ascii-art.txt');
}

// ── 下載 PNG ──
function downloadPNG() {
  if (!lastASCII) { showToast('⚠️ 尚未產生內容'); return; }
  const lines = lastASCII.split('\n').filter(l => l.length > 0);
  const fontSize = 10;
  const lineH = fontSize * 1.2;
  const maxW = Math.max(...lines.map(l => l.length)) * fontSize * 0.6;
  const canvas = document.createElement('canvas');
  canvas.width = maxW + 20; canvas.height = lines.length * lineH + 20;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = currentColor === 'green' ? '#3fb950'
                : currentColor === 'amber' ? '#d29922'
                : currentColor === 'cyan'  ? '#39c5cf'
                : currentColor === 'pink'  ? '#f778ba'
                : '#e6edf3';
  lines.forEach((line, i) => { ctx.fillText(line, 10, 10 + (i + 1) * lineH); });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'ascii-art.png'; a.click();
  showToast('🖼️ 已下載 ascii-art.png');
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

init();
