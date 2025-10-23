import { ImageUtils } from '../src';

const cv = document.getElementById('cv') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const fwInput = document.getElementById('fw') as HTMLInputElement;
const fhInput = document.getElementById('fh') as HTMLInputElement;
const colsInput = document.getElementById('cols') as HTMLInputElement;
const rowsInput = document.getElementById('rows') as HTMLInputElement;
const imgPathInput = document.getElementById('imgPath') as HTMLInputElement;
const imgFileInput = document.getElementById('imgFile') as HTMLInputElement;
const animSelect = document.getElementById('animSelect') as HTMLSelectElement;
const reloadBtn = document.getElementById('reload') as HTMLButtonElement;

let img: HTMLImageElement | null = null;
let rects: { x: number; y: number; w: number; h: number }[] = [];
let animations: { name: string; rects: { x: number; y: number; w: number; h: number }[] }[] = [];
let last = performance.now();
let frameIndex = 0;
let elapsed = 0;
const defaultDuration = 80; // ms

async function setup() {
  // Öncelik: dosya seçilmişse onu kullan
  const file = (imgFileInput && (imgFileInput as any).files && (imgFileInput as any).files[0]) || null;
  if (file) {
    const url = URL.createObjectURL(file);
    try {
      img = await ImageUtils.loadImage(url);
    } catch {
      img = null;
    } finally {
      URL.revokeObjectURL(url);
    }
  } else {
    // Varsayılan yol: assets/...
    const path = (imgPathInput && imgPathInput.value) || 'assets/spritesheet.png';
    try {
      img = await ImageUtils.loadImage(path);
    } catch {
      img = null; // görsel yoksa demo fake karelerle çalışmaya devam etsin
    }
  }
  // Otomatik grid ve animasyon tespiti
  rects = [];
  if (img) {
    const animRes = ImageUtils.autoDetectAnimations(img);
    if (animRes && animRes.animations.length) {
      animations = animRes.animations;
      rects = animations[0].rects;
      // UI alanlarını otomatik doldur
      fwInput.value = String(animRes.frameWidth);
      fhInput.value = String(animRes.frameHeight);
      colsInput.value = String(animRes.cols);
      rowsInput.value = String(animRes.animations.length);

      // Dropdown'u doldur
      if (animSelect) {
        animSelect.innerHTML = '';
        animations.forEach((a, i) => {
          const opt = document.createElement('option');
          opt.value = String(i);
          opt.textContent = a.name;
          animSelect.appendChild(opt);
        });
        animSelect.value = '0';
      }
    } else {
      const res = ImageUtils.autoDetectGrid(img);
      if (res && res.rects.length) {
        rects = res.rects;
        fwInput.value = String(res.frameWidth);
        fhInput.value = String(res.frameHeight);
        colsInput.value = String(res.cols);
        rowsInput.value = String(res.rows);
      }
    }
  }
  frameIndex = 0;
  elapsed = 0;
}

reloadBtn.addEventListener('click', () => {
  setup().catch(console.error);
});

if (imgFileInput) {
  imgFileInput.addEventListener('change', () => {
    setup().catch(console.error);
  });
}

if (animSelect) {
  animSelect.addEventListener('change', () => {
    const idx = parseInt(animSelect.value, 10) || 0;
    rects = animations[idx]?.rects || rects;
    frameIndex = 0;
  });
}

function drawFakeFrame(i: number, w: number, h: number, dx: number, dy: number) {
  // Görsel yoksa sıra numarasına göre renklendirilen bir kare çiz
  const hue = (i * 37) % 360;
  ctx.fillStyle = `hsl(${hue} 60% 50%)`;
  ctx.fillRect(dx, dy, w, h);
  ctx.fillStyle = '#000';
  ctx.font = '16px system-ui';
  ctx.fillText(`#${i}`, dx + 8, dy + 22);
}

function loop(now: number) {
  const dt = now - last;
  last = now;

  ctx.clearRect(0, 0, cv.width, cv.height);

  const fw = parseInt(fwInput.value, 10) || 64;
  const fh = parseInt(fhInput.value, 10) || 64;
  const cols = parseInt(colsInput.value, 10) || 1;
  const rows = parseInt(rowsInput.value, 10) || 1;

  const totalFrames = rects.length || cols * rows;
  const scale = 2;
  const dw = fw * scale;
  const dh = fh * scale;
  const dx = (cv.width - dw) / 2;
  const dy = (cv.height - dh) / 2;

  // Zamanlayıcı
  elapsed += dt;
  while (elapsed >= defaultDuration) {
    elapsed -= defaultDuration;
    frameIndex = (frameIndex + 1) % Math.max(1, totalFrames);
  }

  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  if (img) {
    const r = rects[frameIndex];
    const sx = r ? r.x : col * fw;
    const sy = r ? r.y : row * fh;
    const sw = r ? r.w : fw;
    const sh = r ? r.h : fh;
    // Kaynak görsel küçükse taşmayalım
    try {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    } catch {
      drawFakeFrame(frameIndex, dw, dh, dx, dy);
    }
  } else {
    drawFakeFrame(frameIndex, dw, dh, dx, dy);
  }

  requestAnimationFrame(loop);
}

setup().then(() => requestAnimationFrame(loop)).catch(console.error);
