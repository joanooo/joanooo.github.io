/* =========================================
   首頁流星動畫邏輯 (Index Meteor Animation)
   ========================================= */
const canvas = document.getElementById('meteor-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// 根據螢幕大小決定流星數量
function getMeteorCount() {
  const w = window.innerWidth;
  if (w < 480) return 10;       // 手機
  if (w < 1024) return 15;      // 平板
  return 20;                    // 電腦
}

const colors = [
  { r: 147, g: 197, b: 253 },
  { r: 196, g: 181, b: 253 },
  { r: 186, g: 230, b: 253 },
  { r: 221, g: 214, b: 254 },
];

class Meteor {
  constructor() {
    this.reset();
  }

  reset() {
    const side = Math.floor(Math.random() * 4);
    const w = canvas.width;
    const h = canvas.height;

    if (side === 0) { this.x = Math.random() * w; this.y = -20; }
    else if (side === 1) { this.x = w + 20; this.y = Math.random() * h; }
    else if (side === 2) { this.x = Math.random() * w; this.y = h + 20; }
    else { this.x = -20; this.y = Math.random() * h; }

    const cx = w / 2 + (Math.random() - 0.5) * w * 0.8;
    const cy = h / 2 + (Math.random() - 0.5) * h * 0.8;
    const angle = Math.atan2(cy - this.y, cx - this.x);

    const baseSpeed = window.innerWidth < 480 ? 1.2 : 1.5;
    const speed = baseSpeed + Math.random() * 3;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    const baseLen = window.innerWidth < 480 ? 40 : 60;
    this.length = baseLen + Math.random() * 100;
    this.width = 0.5 + Math.random() * 1.5;
    this.alpha = 0.4 + Math.random() * 0.6;
    this.life = 0;
    this.maxLife = 80 + Math.random() * 80;

    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife) this.reset();
  }

  draw() {
    const progress = this.life / this.maxLife;
    const fade = progress < 0.2
      ? progress / 0.2
      : progress > 0.7
        ? 1 - (progress - 0.7) / 0.3
        : 1;

    const alpha = this.alpha * fade;
    const { r, g, b } = this.color;

    const len = Math.hypot(this.vx, this.vy);
    const tailX = this.x - this.vx / len * this.length;
    const tailY = this.y - this.vy / len * this.length;

    const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = this.width;
    ctx.lineCap = 'round';
    ctx.stroke();

    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 4);
    glow.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }
}

let meteors = [];

function initMeteors() {
  const count = getMeteorCount();
  meteors = Array.from({ length: count }, () => {
    const m = new Meteor();
    m.life = Math.floor(Math.random() * m.maxLife);
    return m;
  });
}

initMeteors();

window.addEventListener('resize', () => {
  resize();
  initMeteors();
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  meteors.forEach(m => { m.update(); m.draw(); });
  requestAnimationFrame(animate);
}

animate();
