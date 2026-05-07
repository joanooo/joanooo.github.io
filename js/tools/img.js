/* =========================================
   圖片工具箱邏輯 (Image Tool JS)
   ========================================= */
let currentImage = null;   // HTMLImageElement
let currentBlob  = null;   // 原始 Blob
let currentName  = 'image';
let currentType  = 'image/png';
let origW = 0, origH = 0;
let lockRatio = true;
let selectedFmt = 'png';

const BG_COLORS = [
  { label:'透明', value:'transparent', cls:'transparent' },
  { label:'白',   value:'#ffffff', style:'background:#ffffff' },
  { label:'黑',   value:'#000000', style:'background:#000000' },
  { label:'紅',   value:'#ef4444', style:'background:#ef4444' },
  { label:'藍',   value:'#3b82f6', style:'background:#3b82f6' },
  { label:'綠',   value:'#22c55e', style:'background:#22c55e' },
  { label:'黃',   value:'#fbbf24', style:'background:#fbbf24' },
];
let selectedBG = 'transparent';

const FORMATS = ['PNG','JPEG','WEBP','BMP'];

function init() {
  // 去背色塊
  document.getElementById('bgSwatches').innerHTML = BG_COLORS.map(c => `
    <div class="bg-swatch ${c.cls||''} ${c.value==='transparent'?'active':''}"
      style="${c.style||''}" title="${c.label}"
      onclick="selectBG('${c.value}',this)"></div>`).join('');

  // 格式按鈕
  document.getElementById('fmtRow').innerHTML = FORMATS.map(f => `
    <div class="fmt-btn ${f==='PNG'?'active':''}" onclick="selectFmt('${f.toLowerCase()}',this)">${f}</div>`).join('');

  // 貼上監聽
  document.addEventListener('paste', handlePaste);
  document.getElementById('pasteZone').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') triggerFileInput();
  });
}

function handlePaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      loadBlob(blob, 'clipboard-image');
      break;
    }
  }
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('pasteZone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadBlob(file, file.name);
}

function triggerFileInput() {
  if (currentImage) return;
  document.getElementById('fileInput').click();
}

function loadFile(e) {
  const file = e.target.files[0];
  if (file) loadBlob(file, file.name);
  e.target.value = '';
}

function loadBlob(blob, name) {
  currentBlob = blob;
  currentType = blob.type || 'image/png';
  currentName = name.replace(/\.[^.]+$/, '') || 'image';
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    origW = img.naturalWidth;
    origH = img.naturalHeight;
    // 顯示預覽
    const preview = document.getElementById('previewImg');
    preview.src = url;
    preview.style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('pasteZone').classList.add('has-image');
    document.getElementById('pasteZone').onclick = null;
    // 資訊列
    document.getElementById('imgDim').textContent = `${origW} × ${origH} px`;
    document.getElementById('imgType').textContent = currentType.replace('image/','').toUpperCase();
    document.getElementById('imgSize').textContent = formatSize(blob.size);
    document.getElementById('imgInfoBar').style.display = 'flex';
    // 縮放預設
    document.getElementById('resizeW').value = origW;
    document.getElementById('resizeH').value = origH;
    // 顯示工具列
    document.getElementById('toolbar').classList.add('visible');
    showToast('✅ 圖片已載入！', 'success');
  };
  img.src = url;
}

function clearImage(e) {
  e.stopPropagation();
  currentImage = null; currentBlob = null;
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('previewImg').src = '';
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('pasteZone').classList.remove('has-image');
  document.getElementById('pasteZone').onclick = triggerFileInput;
  document.getElementById('imgInfoBar').style.display = 'none';
  document.getElementById('toolbar').classList.remove('visible');
  document.getElementById('resultRow').classList.remove('visible');
  document.getElementById('resultRow').innerHTML = '';
}

function quickDownload() {
  if (!currentBlob) return;
  const ext = currentType.split('/')[1] || 'png';
  downloadBlob(currentBlob, `${currentName}.${ext}`);
  showToast('⬇️ 下載完成！', 'success');
}

function removeBG() {
  if (!currentImage) return;
  showProcessing('去背處理中…');
  setTimeout(() => {
    try {
      const threshold = parseInt(document.getElementById('thresholdRange').value);
      const canvas = document.getElementById('workCanvas');
      canvas.width  = origW;
      canvas.height = origH;
      const ctx = canvas.getContext('2d');

      // 填背景
      if (selectedBG !== 'transparent') {
        ctx.fillStyle = selectedBG;
        ctx.fillRect(0, 0, origW, origH);
      }
      ctx.drawImage(currentImage, 0, 0);

      const imgData = ctx.getImageData(0, 0, origW, origH);
      const d = imgData.data;

      // 取四個角落顏色做為背景色樣本
      const samples = [
        [d[0], d[1], d[2]],
        [d[(origW-1)*4], d[(origW-1)*4+1], d[(origW-1)*4+2]],
        [d[(origH-1)*origW*4], d[(origH-1)*origW*4+1], d[(origH-1)*origW*4+2]],
        [d[((origH-1)*origW+(origW-1))*4], d[((origH-1)*origW+(origW-1))*4+1], d[((origH-1)*origW+(origW-1))*4+2]],
      ];
      // 平均背景色
      const bgR = Math.round(samples.reduce((s,c)=>s+c[0],0)/samples.length);
      const bgG = Math.round(samples.reduce((s,c)=>s+c[1],0)/samples.length);
      const bgB = Math.round(samples.reduce((s,c)=>s+c[2],0)/samples.length);

      for (let i = 0; i < d.length; i += 4) {
        const dr = Math.abs(d[i]   - bgR);
        const dg = Math.abs(d[i+1] - bgG);
        const db = Math.abs(d[i+2] - bgB);
        const dist = Math.sqrt(dr*dr + dg*dg + db*db);
        if (dist < threshold) {
          if (selectedBG === 'transparent') {
            d[i+3] = 0;
          } else {
            const hex = selectedBG;
            d[i]   = parseInt(hex.slice(1,3),16);
            d[i+1] = parseInt(hex.slice(3,5),16);
            d[i+2] = parseInt(hex.slice(5,7),16);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob(blob => {
        hideProcessing();
        showResult('去背結果', blob, `${currentName}-nobg.png`);
      }, 'image/png');
    } catch(err) {
      hideProcessing();
      showToast('❌ 去背失敗：' + err.message, 'error');
    }
  }, 50);
}

function convertFormat() {
  if (!currentImage) return;
  const fmt = selectedFmt;
  const mimeMap = { png:'image/png', jpeg:'image/jpeg', webp:'image/webp', bmp:'image/bmp' };
  const mime = mimeMap[fmt] || 'image/png';
  const quality = parseInt(document.getElementById('qualityRange').value) / 100;
  showProcessing(`轉換為 ${fmt.toUpperCase()} 中…`);
  setTimeout(() => {
    const canvas = document.getElementById('workCanvas');
    canvas.width = origW; canvas.height = origH;
    const ctx = canvas.getContext('2d');
    if (fmt === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,origW,origH); }
    ctx.drawImage(currentImage, 0, 0);
    canvas.toBlob(blob => {
      hideProcessing();
      showResult(`轉檔結果 (${fmt.toUpperCase()})`, blob, `${currentName}.${fmt}`);
    }, mime, quality);
  }, 50);
}

function resizeAndDownload() {
  if (!currentImage) return;
  const w = parseInt(document.getElementById('resizeW').value) || origW;
  const h = parseInt(document.getElementById('resizeH').value) || origH;
  showProcessing('縮放中…');
  setTimeout(() => {
    const canvas = document.getElementById('workCanvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(currentImage, 0, 0, w, h);
    canvas.toBlob(blob => {
      hideProcessing();
      showResult(`縮放結果 (${w}×${h})`, blob, `${currentName}-${w}x${h}.png`);
    }, 'image/png');
  }, 50);
}

function syncResize(changed) {
  if (!lockRatio) return;
  const w = parseInt(document.getElementById('resizeW').value);
  const h = parseInt(document.getElementById('resizeH').value);
  if (changed === 'w' && w > 0) document.getElementById('resizeH').value = Math.round(w / origW * origH);
  if (changed === 'h' && h > 0) document.getElementById('resizeW').value = Math.round(h / origH * origW);
}

function setResizePercent(pct) {
  const w = Math.round(origW * pct / 100);
  const h = Math.round(origH * pct / 100);
  document.getElementById('resizeW').value = w;
  document.getElementById('resizeH').value = h;
}

function toggleLock() {
  lockRatio = !lockRatio;
  const btn = document.getElementById('lockBtn');
  btn.textContent = lockRatio ? '🔒' : '🔓';
  btn.classList.toggle('locked', lockRatio);
}

function showResult(title, blob, filename) {
  const url = URL.createObjectURL(blob);
  const size = formatSize(blob.size);
  const row = document.getElementById('resultRow');
  row.classList.add('visible');
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-card-header">
      <span>${title}</span>
      <span style="color:var(--text3);">${size}</span>
    </div>
    <img src="${url}" alt="${title}">
    <div class="result-card-footer">
      <button class="btn btn-green btn-sm" style="flex:1;" onclick="downloadUrl('${url}','${filename}')">⬇️ 下載</button>
      <button class="btn btn-ghost btn-sm" onclick="useAsSource('${url}','${filename}')">📌 設為來源</button>
    </div>`;
  row.prepend(card);
  showToast(`✅ ${title} 完成！`, 'success');
}

function useAsSource(url, name) {
  fetch(url).then(r=>r.blob()).then(blob => {
    loadBlob(blob, name);
  });
}

function selectBG(val, el) {
  selectedBG = val;
  document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function selectFmt(fmt, el) {
  selectedFmt = fmt;
  document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const qualityRow = document.getElementById('qualityRow');
  qualityRow.style.display = (fmt === 'jpeg' || fmt === 'webp') ? 'flex' : 'none';
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name; a.click();
}

function downloadUrl(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}

function showProcessing(text) {
  document.getElementById('processingText').textContent = text;
  document.getElementById('processingOverlay').classList.add('show');
}
function hideProcessing() {
  document.getElementById('processingOverlay').classList.remove('show');
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('qualityRow').style.display = 'none';
});

init();
