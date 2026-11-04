// Вся графика рисуется кодом при запуске: никаких файлов изображений.
import { FISH, FishDef } from './data';

const PAD = 6;

function darker(c: number, k = 0.65): number {
  const r = ((c >> 16) & 255) * k;
  const g = ((c >> 8) & 255) * k;
  const b = (c & 255) * k;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function drawFish(g: PGraphics, f: FishDef): void {
  const { w, h } = f;
  const cx = w / 2 + PAD;
  const cy = h / 2 + PAD;
  const outline = darker(f.color, 0.55);

  if (f.shape === 'boot') {
    g.fillStyle(f.color, 1);
    g.fillRoundedRect(cx - w * 0.35, cy - h / 2, w * 0.42, h * 0.8, 4);
    g.fillRoundedRect(cx - w * 0.35, cy + h * 0.08, w * 0.85, h * 0.42, 8);
    g.fillStyle(f.fin, 1);
    g.fillRect(cx - w * 0.35, cy + h * 0.4, w * 0.85, h * 0.1);
    g.fillStyle(f.belly, 1);
    g.fillRect(cx - w * 0.35, cy - h / 2, w * 0.42, h * 0.08);
    g.lineStyle(2, 0x1c120a, 1);
    g.strokeRoundedRect(cx - w * 0.35, cy - h / 2, w * 0.42, h * 0.8, 4);
    return;
  }
  if (f.shape === 'can') {
    g.fillStyle(f.color, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);
    g.fillStyle(f.belly, 1);
    g.fillRect(cx - w / 2, cy - h * 0.22, w, h * 0.44);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(cx - w * 0.3, cy - h * 0.06, w * 0.6, h * 0.12);
    g.lineStyle(2, f.fin, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);
    g.lineBetween(cx - w / 2, cy - h * 0.38, cx + w / 2, cy - h * 0.38);
    g.lineBetween(cx - w / 2, cy + h * 0.38, cx + w / 2, cy + h * 0.38);
    return;
  }
  if (f.shape === 'tire') {
    const r = w / 2;
    g.lineStyle(r * 0.55, f.color, 1);
    g.strokeCircle(cx, cy, r - r * 0.28);
    g.lineStyle(2, f.belly, 1);
    g.strokeCircle(cx, cy, r * 0.62);
    g.lineStyle(3, f.fin, 1);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.lineBetween(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1));
    }
    return;
  }

  const long = f.shape === 'long' || f.shape === 'cat';
  const bodyW = long ? w * 0.86 : w * 0.8;
  const bodyX = cx + w * 0.06;

  // хвост
  g.fillStyle(f.fin, 1);
  const tailLen = f.shape === 'gold' ? 0.5 : 0.2;
  g.fillTriangle(cx - w * 0.33, cy, cx - w / 2, cy - h * (f.shape === 'gold' ? 0.5 : 0.42), cx - w / 2, cy + h * (f.shape === 'gold' ? 0.5 : 0.42));
  if (f.shape === 'gold') {
    g.fillStyle(f.fin, 0.6);
    g.fillTriangle(cx - w * 0.3, cy, cx - w / 2, cy - h * tailLen, cx - w * 0.42, cy + h * 0.1);
  }

  // спинной плавник
  g.fillStyle(f.fin, 1);
  if (f.shape === 'ruff') {
    for (let i = 0; i < 6; i++) {
      const x = cx - w * 0.18 + i * w * 0.07;
      g.fillTriangle(x, cy - h * 0.3, x + w * 0.06, cy - h * 0.3, x + w * 0.02, cy - h * 0.6);
    }
  } else if (f.shape === 'cat') {
    g.fillTriangle(cx - w * 0.05, cy - h * 0.3, cx + w * 0.05, cy - h * 0.3, cx - w * 0.02, cy - h * 0.55);
    g.fillEllipse(cx - w * 0.15, cy + h * 0.3, w * 0.5, h * 0.3); // длинный анальный плавник
  } else {
    g.fillTriangle(cx - w * 0.12, cy - h * 0.3, cx + w * 0.1, cy - h * 0.3, cx - w * 0.1, cy - h * 0.6);
  }
  // брюшной плавник
  g.fillTriangle(cx + w * 0.02, cy + h * 0.35, cx + w * 0.14, cy + h * 0.35, cx + w * 0.02, cy + h * 0.58);

  // тело
  g.fillStyle(f.color, 1);
  g.fillEllipse(bodyX, cy, bodyW, f.shape === 'cat' ? h * 0.85 : h);
  if (f.shape === 'long') {
    // морда-клин
    g.fillTriangle(bodyX + bodyW * 0.38, cy - h * 0.3, bodyX + bodyW * 0.38, cy + h * 0.25, cx + w / 2, cy + h * 0.02);
  }
  if (f.shape === 'cat') {
    g.fillEllipse(cx + w * 0.3, cy + h * 0.02, w * 0.36, h * 0.8); // широкая голова
  }
  // брюхо
  g.fillStyle(f.belly, 1);
  g.fillEllipse(bodyX + w * 0.02, cy + h * 0.2, bodyW * 0.72, h * 0.42);

  if (f.shape === 'striped') {
    g.fillStyle(0x2f3d12, 0.55);
    for (const k of [-0.18, -0.04, 0.1, 0.24]) g.fillRect(cx + w * k, cy - h * 0.38, w * 0.055, h * 0.58);
  }
  if (f.shape === 'long' && f.id === 'shchuka') {
    g.fillStyle(0xd5dfa8, 0.55);
    for (let i = 0; i < 9; i++) g.fillEllipse(cx - w * 0.25 + (i % 5) * w * 0.12, cy - h * 0.15 + Math.floor(i / 5) * h * 0.22, w * 0.05, h * 0.12);
  }
  if (f.shape === 'gold') {
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(bodyX - w * 0.05, cy - h * 0.2, w * 0.25, h * 0.12);
  }

  // контур
  g.lineStyle(2, outline, 0.9);
  g.strokeEllipse(bodyX, cy, bodyW, f.shape === 'cat' ? h * 0.85 : h);

  // жабра
  g.lineStyle(2, outline, 0.7);
  g.beginPath();
  g.arc(cx + w * 0.2, cy, h * 0.3, -1.1, 1.1, false);
  g.strokePath();

  // глаз
  const er = Math.max(3, Math.min(h * 0.14, 9));
  const ex = f.shape === 'cat' ? cx + w * 0.36 : cx + w * 0.3;
  const ey = cy - h * 0.13;
  g.fillStyle(0xffffff, 1);
  g.fillCircle(ex, ey, er);
  g.fillStyle(f.id === 'plotva' ? 0xc0261b : 0x111111, 1);
  g.fillCircle(ex + er * 0.25, ey, er * 0.55);

  if (f.shape === 'cat') {
    g.lineStyle(3, 0x2a2920, 1);
    g.lineBetween(cx + w * 0.44, cy + h * 0.08, cx + w * 0.49, cy + h * 0.5);
    g.lineBetween(cx + w * 0.42, cy + h * 0.1, cx + w * 0.36, cy + h * 0.52);
    g.lineStyle(2, 0x2a2920, 1);
    g.lineBetween(cx + w * 0.4, cy + h * 0.2, cx + w * 0.47, cy + h * 0.2);
  }
}

export function makeTextures(scene: PScene): void {
  const make = () => scene.make.graphics({ x: 0, y: 0 }, false);

  for (const f of FISH) {
    const g = make();
    drawFish(g, f);
    g.generateTexture('fish_' + f.id, f.w + PAD * 2, f.h + PAD * 2);
    g.destroy();
  }

  // блесна
  {
    const g = make();
    g.lineStyle(2, 0x444444, 1);
    g.lineBetween(14, 0, 14, 8);
    g.fillStyle(0xc23a2b, 1);
    g.fillCircle(14, 10, 4);
    g.fillStyle(0xd8dde2, 1);
    g.fillEllipse(14, 22, 16, 22);
    g.fillStyle(0xffffff, 0.8);
    g.fillEllipse(11, 19, 5, 10);
    g.lineStyle(2, 0x6b7177, 1);
    g.strokeEllipse(14, 22, 16, 22);
    g.lineStyle(3, 0x333333, 1);
    g.beginPath();
    g.arc(14, 36, 6, 0, Math.PI, false);
    g.strokePath();
    g.lineBetween(20, 36, 20, 32);
    g.generateTexture('lure', 28, 46);
    g.destroy();
  }

  // свечение
  {
    const g = make();
    for (let i = 40; i > 0; i--) {
      g.fillStyle(0xfff3c0, 0.025);
      g.fillCircle(128, 128, i * 3.2);
    }
    g.generateTexture('glow', 256, 256);
    g.destroy();
  }

  // лодка с рыбаком (смотрит вправо, удочка вверх-вправо)
  {
    const g = make();
    // рыбак
    g.fillStyle(0x2e5a8a, 1); // куртка
    g.fillRoundedRect(118, 70, 46, 56, 10);
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 4; i++) g.fillRect(124, 78 + i * 12, 34, 5); // тельняшка видна в вороте
    g.fillStyle(0x2e5a8a, 1);
    g.fillRect(118, 78, 8, 46);
    g.fillRect(156, 78, 8, 46);
    g.fillStyle(0xf1c7a0, 1);
    g.fillCircle(141, 52, 20); // голова
    g.fillStyle(0x8a5a2b, 1);
    g.fillEllipse(141, 66, 30, 12); // борода
    g.fillStyle(0x3a3a3a, 1);
    g.fillRoundedRect(119, 26, 44, 16, 6); // кепка
    g.fillRect(150, 34, 22, 6);
    g.fillStyle(0x111111, 1);
    g.fillCircle(150, 50, 2.5);
    // удочка
    g.lineStyle(4, 0x7a4a1e, 1);
    g.lineBetween(160, 96, 270, 8);
    g.fillStyle(0xf1c7a0, 1);
    g.fillCircle(162, 96, 7);
    // лодка
    g.fillStyle(0x9b5a2c, 1);
    g.beginPath();
    g.moveTo(10, 120);
    g.lineTo(280, 120);
    g.lineTo(245, 175);
    g.lineTo(45, 175);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xd9533b, 1);
    g.fillRect(22, 128, 248, 10);
    g.fillStyle(0x6e3e1c, 1);
    g.fillRect(10, 116, 270, 8);
    g.lineStyle(3, 0x5a3215, 1);
    g.lineBetween(45, 175, 245, 175);
    g.generateTexture('boat', 290, 180);
    g.destroy();
  }

  // облако
  {
    const g = make();
    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(70, 50, 110, 50);
    g.fillEllipse(120, 40, 100, 60);
    g.fillEllipse(160, 55, 90, 40);
    g.generateTexture('cloud', 220, 90);
    g.destroy();
  }

  // прицел
  {
    const g = make();
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeCircle(32, 32, 18);
    g.lineBetween(32, 4, 32, 20);
    g.lineBetween(32, 44, 32, 60);
    g.lineBetween(4, 32, 20, 32);
    g.lineBetween(44, 32, 60, 32);
    g.fillStyle(0xd9533b, 1);
    g.fillCircle(32, 32, 3);
    g.generateTexture('cross', 64, 64);
    g.destroy();
  }

  // точка для частиц и пузырь
  {
    const g = make();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16);
    g.destroy();
    const b = make();
    b.lineStyle(2, 0xffffff, 0.7);
    b.strokeCircle(8, 8, 6);
    b.fillStyle(0xffffff, 0.6);
    b.fillCircle(6, 6, 2);
    b.generateTexture('bubble', 16, 16);
    b.destroy();
  }

  // камыш
  {
    const g = make();
    g.fillStyle(0x4f7a2a, 1);
    for (let i = 0; i < 7; i++) {
      const x = 10 + i * 13;
      const hgt = 120 + ((i * 37) % 60);
      g.fillRect(x, 200 - hgt, 4, hgt);
      if (i % 2 === 0) {
        g.fillStyle(0x6b4423, 1);
        g.fillRoundedRect(x - 3, 200 - hgt - 6, 10, 34, 5);
        g.fillStyle(0x4f7a2a, 1);
      }
    }
    g.generateTexture('reeds', 110, 200);
    g.destroy();
  }

  // водоросли на дне
  {
    const g = make();
    g.fillStyle(0x2e5a2a, 1);
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 18;
      g.fillEllipse(x, 90 - i * 6, 10, 120 - i * 8);
    }
    g.generateTexture('weed', 100, 150);
    g.destroy();
  }
}
