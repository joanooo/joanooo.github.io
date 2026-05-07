/* =========================================
   QR Code 產生器邏輯 (toQrcode JS)
   ========================================= */
let lastText = '';
let lastSize = 256;

function updateCharCount() {
  const len = document.getElementById('inputText').value.length;
  const el = document.getElementById('charCount');
  el.textContent = `${len} 字元`;
  el.className = 'char-count' + (len > 500 ? ' over' : len > 300 ? ' warn' : '');
}

function syncColorLabel(inputId, labelId) {
  document.getElementById(labelId).textContent = document.getElementById(inputId).value;
}

function generateQR() {
  const text = document.getElementById('inputText').value.trim();
  if (!text) { alert('請輸入文字或網址！'); return; }

  const size     = parseInt(document.getElementById('qrSize').value);
  const correct  = document.getElementById('qrCorrect').value;
  const colorDark  = document.getElementById('colorDark').value;
  const colorLight = document.getElementById('colorLight').value;

  lastText = text;
  lastSize = size;

  // 清除舊的
  const container = document.getElementById('qrcode');
  container.innerHTML = '';

  new QRCode(container, {
    text: text,
    width: size,
    height: size,
    colorDark: colorDark,
    colorLight: colorLight,
    correctLevel: QRCode.CorrectLevel[correct]
  });

  // 顯示資訊
  const display = text.length > 60 ? text.substring(0, 60) + '…' : text;
  document.getElementById('qrInfo').innerHTML =
    `<strong>內容：</strong>${escapeHtml(display)}<br>` +
    `<strong>尺寸：</strong>${size}×${size} px　` +
    `<strong>容錯：</strong>${correct}`;

  document.getElementById('qrDisplay').style.display = 'flex';
  document.getElementById('divider').style.display = 'block';

  // 滾動到 QR Code
  setTimeout(() => {
    document.getElementById('qrDisplay').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// ===== 下載 PNG =====
function downloadPNG() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) { alert('請先產生 QR Code！'); return; }
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ===== 下載 SVG =====
function downloadSVG() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) { alert('請先產生 QR Code！'); return; }

  const size = lastSize;
  const dataURL = canvas.toDataURL('image/png');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image href="${dataURL}" width="${size}" height="${size}"/>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'qrcode.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== 複製圖片 =====
async function copyImage() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) { alert('請先產生 QR Code！'); return; }
  const btn = document.getElementById('btnCopyImg');
  try {
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        btn.textContent = '✅ 已複製';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '📋 複製圖片'; btn.classList.remove('copied'); }, 2000);
      } catch(e) {
        alert('您的瀏覽器不支援複製圖片，請使用下載 PNG 功能');
      }
    });
  } catch(e) {
    alert('複製失敗，請使用下載 PNG 功能');
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Enter 快速產生
document.getElementById('inputText').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.ctrlKey) generateQR();
});
