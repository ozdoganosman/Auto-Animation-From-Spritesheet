import { ImageUtils, GenericJSONExporter } from './src';
import JSZip from 'jszip';

const cv = document.getElementById('cv') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const imgPathInput = document.getElementById('imgPath') as HTMLInputElement;
const imgFileInput = document.getElementById('imgFile') as HTMLInputElement;
const animSelect = document.getElementById('animSelect') as HTMLSelectElement;
const reloadBtn = document.getElementById('reload') as HTMLButtonElement;
const downloadCurrentBtn = document.getElementById('downloadCurrent') as HTMLButtonElement;
const downloadAllBtn = document.getElementById('downloadAll') as HTMLButtonElement;
const downloadPNGBtn = document.getElementById('downloadPNG') as HTMLButtonElement;
const downloadZIPBtn = document.getElementById('downloadZIP') as HTMLButtonElement;

let img: HTMLImageElement | null = null;
let rects: { x: number; y: number; w: number; h: number }[] = [];
let animations: { name: string; rects: { x: number; y: number; w: number; h: number }[] }[] = [];
let last = performance.now();
let frameIndex = 0;
let elapsed = 0;
const defaultDuration = 80; // ms
let frameW = 64;
let frameH = 64;
let cols = 1;
let rows = 1;
let currentAnimIndex = 0;
let lastImageSource = '';

async function setup() {
  // Öncelik: dosya seçilmişse onu kullan
  const file = (imgFileInput && (imgFileInput as any).files && (imgFileInput as any).files[0]) || null;
  if (file) {
    const url = URL.createObjectURL(file);
    try {
      img = await ImageUtils.loadImage(url);
      lastImageSource = file.name || 'uploaded-image';
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
      lastImageSource = path;
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
      // Tespit edilen ölçüleri ata
      frameW = animRes.frameWidth;
      frameH = animRes.frameHeight;
      cols = animRes.cols;
      rows = animRes.animations.length;

      // Dropdown'u doldur
      if (animSelect) {
        animSelect.innerHTML = '';
        animations.forEach((a, i) => {
          const opt = document.createElement('option');
          opt.value = String(i);
          opt.textContent = a.name;
          animSelect.appendChild(opt);
        });
        currentAnimIndex = 0;
        animSelect.value = String(currentAnimIndex);
      }
    } else {
      const res = ImageUtils.autoDetectGrid(img);
      if (res && res.rects.length) {
        rects = res.rects;
        frameW = res.frameWidth;
        frameH = res.frameHeight;
        cols = res.cols;
        rows = res.rows;
        // Tek animasyon varsayalım
        animations = [{ name: 'Animation', rects: rects.slice() }];
        if (animSelect) {
          animSelect.innerHTML = '';
          const opt = document.createElement('option');
          opt.value = '0';
          opt.textContent = 'Animation';
          animSelect.appendChild(opt);
          currentAnimIndex = 0;
          animSelect.value = '0';
        }
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
    currentAnimIndex = idx;
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

  const fw = frameW || 64;
  const fh = frameH || 64;

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

// --- Export helpers ---
function buildExportData(animList: { name: string; rects: { x: number; y: number; w: number; h: number }[] }[]) {
  return {
    image: lastImageSource,
    frameWidth: frameW,
    frameHeight: frameH,
    cols,
    rows,
    animations: animList
  };
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const exporter = new GenericJSONExporter();

if (downloadCurrentBtn) {
  downloadCurrentBtn.addEventListener('click', () => {
    const list = animations.length ? [animations[currentAnimIndex] ?? animations[0]] : [{ name: 'Animation', rects }];
    const data = buildExportData(list);
    const json = exporter.export(data);
    downloadText('animation-current.json', json);
  });
}

if (downloadAllBtn) {
  downloadAllBtn.addEventListener('click', () => {
    const list = animations.length ? animations : [{ name: 'Animation', rects }];
    const data = buildExportData(list);
    const json = exporter.export(data);
    downloadText('animations-all.json', json);
  });
}

// ---- PNG spritesheet of current animation ----
function sanitize(name: string) {
  return (name || 'animation').replace(/[^a-z0-9_-]+/gi, '_');
}

async function buildSpriteStripPNG(anim: { name: string; rects: { x: number; y: number; w: number; h: number }[] }) {
  if (!img) throw new Error('No image loaded');
  const cellW = Math.max(frameW, ...anim.rects.map(r => r.w || frameW));
  const cellH = Math.max(frameH, ...anim.rects.map(r => r.h || frameH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, anim.rects.length) * cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  anim.rects.forEach((r, i) => {
    const dx = i * cellW + Math.floor((cellW - r.w) / 2);
    const dy = Math.floor((cellH - r.h) / 2);
    try {
      c.drawImage(img as HTMLImageElement, r.x, r.y, r.w, r.h, dx, dy, r.w, r.h);
    } catch {}
  });
  return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));
}

if (downloadPNGBtn) {
  downloadPNGBtn.addEventListener('click', async () => {
    try {
      const anim = animations.length ? (animations[currentAnimIndex] ?? animations[0]) : { name: 'Animation', rects };
      const blob = await buildSpriteStripPNG(anim);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${sanitize(anim.name)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    }
  });
}

// ---- ZIP with all animations' PNG + JSON ----
if (downloadZIPBtn) {
  downloadZIPBtn.addEventListener('click', async () => {
    try {
      const list = animations.length ? animations : [{ name: 'Animation', rects }];
      const zip = new JSZip();
      // JSON manifest
      const json = exporter.export(buildExportData(list));
      zip.file('animations.json', json);
      // PNGs per animation
      for (const an of list) {
        const blob = await buildSpriteStripPNG(an);
        const arrayBuf = await blob.arrayBuffer();
        zip.file(`sprites/${sanitize(an.name)}.png`, arrayBuf);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'animations.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    }
  });
}
