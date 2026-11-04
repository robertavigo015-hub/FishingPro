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

  if (f.shape === 'anchor') {
    g.lineStyle(7, f.color, 1);
    g.strokeCircle(cx, cy - h * 0.4, 6);
    g.lineBetween(cx, cy - h * 0.32, cx, cy + h * 0.38);
    g.lineBetween(cx - w * 0.28, cy - h * 0.16, cx + w * 0.28, cy - h * 0.16);
    g.beginPath();
    g.arc(cx, cy + h * 0.05, w * 0.4, 0.25, Math.PI - 0.25, false);
    g.strokePath();
    g.fillStyle(f.color, 1);
    g.fillTriangle(cx - w * 0.47, cy + h * 0.05, cx - w * 0.32, cy + h * 0.2, cx - w * 0.44, cy + h * 0.26);
    g.fillTriangle(cx + w * 0.47, cy + h * 0.05, cx + w * 0.32, cy + h * 0.2, cx + w * 0.44, cy + h * 0.26);
    return;
  }
  if (f.shape === 'bottle') {
    g.fillStyle(f.color, 0.9);
    g.fillRoundedRect(cx - w / 2, cy - h * 0.15, w, h * 0.65, 6);
    g.fillRect(cx - w * 0.18, cy - h / 2 + 4, w * 0.36, h * 0.4);
    g.fillStyle(0x8a5a2b, 1);
    g.fillRect(cx - w * 0.2, cy - h / 2, w * 0.4, 6);
    g.fillStyle(f.belly, 1);
    g.fillRoundedRect(cx - w * 0.28, cy, w * 0.56, h * 0.3, 3);
    g.fillStyle(0xffffff, 0.45);
    g.fillRect(cx - w * 0.38, cy - h * 0.1, 3, h * 0.5);
    return;
  }
  if (f.shape === 'buoy') {
    g.lineStyle(3, 0x333333, 1);
    g.lineBetween(cx, cy - h / 2, cx, cy - h * 0.15);
    g.fillStyle(0xffe58a, 1);
    g.fillCircle(cx, cy - h / 2 + 4, 4);
    g.fillStyle(f.color, 1);
    g.fillEllipse(cx, cy + h * 0.15, w, h * 0.68);
    g.fillStyle(f.belly, 1);
    g.fillRect(cx - w / 2 + 3, cy + h * 0.08, w - 6, h * 0.12);
    g.lineStyle(2, f.fin, 1);
    g.strokeEllipse(cx, cy + h * 0.15, w, h * 0.68);
    return;
  }
  if (f.shape === 'crab') {
    g.lineStyle(4, f.fin, 1);
    for (let i = 0; i < 4; i++) {
      const x = cx - w * 0.22 + i * w * 0.14;
      g.lineBetween(x, cy + h * 0.1, x - w * 0.12, cy + h * 0.5);
      g.lineBetween(x, cy - h * 0.05, x - w * 0.14, cy - h * 0.42);
    }
    g.fillStyle(f.color, 1);
    g.fillEllipse(cx - w * 0.04, cy, w * 0.62, h * 0.62);
    g.fillCircle(cx + w * 0.38, cy - h * 0.25, w * 0.11);
    g.fillCircle(cx + w * 0.38, cy + h * 0.25, w * 0.11);
    g.lineStyle(5, f.color, 1);
    g.lineBetween(cx + w * 0.2, cy - h * 0.1, cx + w * 0.34, cy - h * 0.22);
    g.lineBetween(cx + w * 0.2, cy + h * 0.1, cx + w * 0.34, cy + h * 0.22);
    g.fillStyle(f.belly, 0.7);
    for (let i = 0; i < 6; i++) g.fillCircle(cx - w * 0.2 + (i % 3) * w * 0.14, cy - h * 0.12 + Math.floor(i / 3) * h * 0.2, 2.5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + w * 0.24, cy - h * 0.08, 3);
    g.fillCircle(cx + w * 0.24, cy + h * 0.08, 3);
    return;
  }
  if (f.shape === 'squid') {
    // голова-мантия слева, щупальца вправо
    g.lineStyle(6, f.fin, 1);
    for (let i = 0; i < 6; i++) {
      const yy = cy - h * 0.25 + i * h * 0.1;
      g.beginPath();
      g.moveTo(cx + w * 0.05, yy);
      g.lineTo(cx + w * 0.22, yy + Math.sin(i) * 10);
      g.lineTo(cx + w * 0.38, yy - Math.sin(i * 1.7) * 12);
      g.lineTo(cx + w * 0.48, yy + Math.cos(i) * 8);
      g.strokePath();
    }
    g.fillStyle(f.color, 1);
    g.fillEllipse(cx - w * 0.15, cy, w * 0.6, h * 0.56);
    g.fillTriangle(cx - w * 0.5, cy, cx - w * 0.36, cy - h * 0.48, cx - w * 0.3, cy);
    g.fillTriangle(cx - w * 0.5, cy, cx - w * 0.36, cy + h * 0.48, cx - w * 0.3, cy);
    g.fillStyle(f.belly, 0.6);
    for (let i = 0; i < 8; i++) g.fillCircle(cx - w * 0.35 + i * w * 0.06, cy - h * 0.1 + ((i * 37) % 20) - 10, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + w * 0.06, cy - h * 0.06, h * 0.13);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + w * 0.07, cy - h * 0.06, h * 0.08);
    return;
  }
  if (f.shape === 'angler') {
    g.fillStyle(f.fin, 1);
    g.fillTriangle(cx - w * 0.3, cy, cx - w / 2, cy - h * 0.35, cx - w / 2, cy + h * 0.35);
    g.fillStyle(f.color, 1);
    g.fillCircle(cx, cy + h * 0.05, h * 0.42);
    g.fillStyle(0x1a0a0a, 1);
    g.fillEllipse(cx + w * 0.2, cy + h * 0.15, w * 0.32, h * 0.32);
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 5; i++) g.fillTriangle(cx + w * 0.08 + i * w * 0.06, cy + h * 0.01, cx + w * 0.11 + i * w * 0.06, cy + h * 0.13, cx + w * 0.14 + i * w * 0.06, cy + h * 0.01);
    g.lineStyle(2, f.belly, 1);
    g.beginPath();
    g.moveTo(cx, cy - h * 0.3);
    g.lineTo(cx + w * 0.18, cy - h * 0.48);
    g.lineTo(cx + w * 0.36, cy - h * 0.38);
    g.strokePath();
    g.fillStyle(0xfff3a0, 1);
    g.fillCircle(cx + w * 0.38, cy - h * 0.36, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + w * 0.12, cy - h * 0.14, 5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + w * 0.13, cy - h * 0.14, 2.5);
    return;
  }
  if (f.shape === 'seal') {
    g.fillStyle(f.fin, 1);
    g.fillTriangle(cx - w * 0.36, cy, cx - w / 2, cy - h * 0.38, cx - w / 2, cy + h * 0.38);
    g.fillEllipse(cx + w * 0.02, cy + h * 0.32, w * 0.2, h * 0.26);
    g.fillStyle(f.color, 1);
    g.fillEllipse(cx - w * 0.04, cy + h * 0.02, w * 0.72, h * 0.78);
    g.fillCircle(cx + w * 0.3, cy - h * 0.06, h * 0.4);
    g.fillStyle(f.belly, 1);
    g.fillEllipse(cx - w * 0.02, cy + h * 0.2, w * 0.5, h * 0.3);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + w * 0.36, cy - h * 0.16, 4);
    g.fillCircle(cx + w * 0.24, cy - h * 0.16, 4);
    g.fillCircle(cx + w * 0.44, cy - h * 0.0, 3);
    g.lineStyle(1, 0x333333, 1);
    g.lineBetween(cx + w * 0.42, cy + h * 0.04, cx + w * 0.5, cy + h * 0.0);
    g.lineBetween(cx + w * 0.42, cy + h * 0.07, cx + w * 0.5, cy + h * 0.1);
    return;
  }
  if (f.shape === 'flat') {
    g.fillStyle(f.fin, 1);
    g.fillTriangle(cx - w * 0.36, cy, cx - w / 2, cy - h * 0.3, cx - w / 2, cy + h * 0.3);
    g.fillEllipse(cx + w * 0.02, cy, w * 0.8, h);
    g.fillStyle(f.color, 1);
    g.fillEllipse(cx + w * 0.04, cy, w * 0.68, h * 0.8);
    g.fillStyle(f.belly, 0.5);
    for (let i = 0; i < 7; i++) g.fillCircle(cx - w * 0.18 + (i % 4) * w * 0.12, cy - h * 0.15 + Math.floor(i / 4) * h * 0.3, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + w * 0.26, cy - h * 0.2, 5);
    g.fillCircle(cx + w * 0.3, cy - h * 0.02, 5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + w * 0.27, cy - h * 0.2, 2.5);
    g.fillCircle(cx + w * 0.31, cy - h * 0.02, 2.5);
    return;
  }

  const long = f.shape === 'long' || f.shape === 'cat' || f.shape === 'sturgeon';
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
  } else if (f.shape === 'sail') {
    g.fillPoints([{ x: cx - w * 0.22, y: cy - h * 0.3 }, { x: cx - w * 0.16, y: cy - h * 0.62 }, { x: cx + w * 0.02, y: cy - h * 0.62 }, { x: cx + w * 0.12, y: cy - h * 0.3 }], true);
    g.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 3; i++) g.fillCircle(cx - w * 0.12 + i * w * 0.07, cy - h * 0.45, 2);
    g.fillStyle(f.fin, 1);
  } else if (f.shape === 'sturgeon') {
    g.fillTriangle(cx - w * 0.2, cy - h * 0.3, cx - w * 0.08, cy - h * 0.3, cx - w * 0.18, cy - h * 0.55);
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
  if (f.shape === 'long' || f.shape === 'sturgeon') {
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
  if (f.shape === 'sturgeon') {
    g.fillStyle(f.belly, 0.9);
    for (let i = 0; i < 9; i++) {
      const x = cx - w * 0.3 + i * w * 0.07;
      g.fillTriangle(x, cy - h * 0.36, x + w * 0.025, cy - h * 0.5, x + w * 0.05, cy - h * 0.36);
    }
  }
  if (f.id === 'lenok' || f.id === 'treska' || f.id === 'albinos') {
    g.fillStyle(f.id === 'albinos' ? 0xe8d8c8 : 0x3a2a1a, 0.45);
    for (let i = 0; i < 10; i++) g.fillCircle(cx - w * 0.22 + (i % 5) * w * 0.1, cy - h * 0.16 + Math.floor(i / 5) * h * 0.2, 2.5);
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

  // рыбак (смотрит вправо, удочка вверх-вправо); winter — ушанка и тулуп
  const drawFisher = (g: PGraphics, winter: boolean) => {
    const coat = winter ? 0x5a4632 : 0x2e5a8a;
    g.fillStyle(coat, 1);
    g.fillRoundedRect(118, 70, 46, 56, 10);
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 4; i++) g.fillRect(124, 78 + i * 12, 34, 5);
    g.fillStyle(coat, 1);
    g.fillRect(118, 78, 8, 46);
    g.fillRect(156, 78, 8, 46);
    if (winter) {
      g.fillStyle(0xe8dcc8, 1); // мех воротника
      g.fillRoundedRect(116, 68, 50, 10, 5);
    }
    g.fillStyle(0xf1c7a0, 1);
    g.fillCircle(141, 52, 20);
    g.fillStyle(0x8a5a2b, 1);
    g.fillEllipse(141, 66, 30, 12);
    if (winter) {
      g.fillStyle(0x4a3a2a, 1); // ушанка
      g.fillRoundedRect(117, 22, 48, 22, 8);
      g.fillRoundedRect(114, 36, 12, 24, 5);
      g.fillRoundedRect(156, 36, 12, 24, 5);
      g.fillStyle(0x6b5a48, 1);
      g.fillRect(119, 38, 44, 6);
    } else {
      g.fillStyle(0x3a3a3a, 1);
      g.fillRoundedRect(119, 26, 44, 16, 6);
      g.fillRect(150, 34, 22, 6);
    }
    g.fillStyle(0x111111, 1);
    g.fillCircle(150, 50, 2.5);
    g.lineStyle(4, 0x7a4a1e, 1);
    g.lineBetween(160, 96, 270, 8);
    g.fillStyle(0xf1c7a0, 1);
    g.fillCircle(162, 96, 7);
  };

  // лодка с рыбаком
  {
    const g = make();
    drawFisher(g, false);
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

  // рыбак на льду: сидит на рыбацком ящике
  {
    const g = make();
    drawFisher(g, true);
    g.fillStyle(0x3a6ea5, 1);
    g.fillRoundedRect(104, 118, 76, 44, 6);
    g.fillStyle(0xd9e4ee, 1);
    g.fillRect(104, 118, 76, 8);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(136, 112, 12, 8);
    g.fillStyle(0x7a4a1e, 1); // ледобур рядом
    g.fillRect(40, 60, 6, 100);
    g.fillRect(28, 60, 30, 6);
    g.fillStyle(0x9aa4ad, 1);
    g.fillRect(40, 150, 6, 22);
    g.generateTexture('icefisher', 290, 180);
    g.destroy();
  }

  // миниган (смотрит вправо)
  {
    const g = make();
    g.fillStyle(0x2a2d31, 1);
    g.fillRoundedRect(6, 8, 40, 26, 6);
    g.fillRect(18, 30, 12, 14);
    g.fillStyle(0x3a3f45, 1);
    for (let i = 0; i < 3; i++) g.fillRect(44, 9 + i * 8, 70, 6);
    g.fillStyle(0x6b737c, 1);
    g.fillRect(44, 8, 70, 2);
    g.fillRect(70, 6, 6, 28);
    g.fillRect(104, 6, 6, 28);
    g.generateTexture('gun_minigun', 116, 46);
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

  // оружие (смотрит вправо; точка вращения — рукоять)
  {
    const steel = 0x3a3f45, steelHi = 0x6b737c, wood = 0x8a5a2b, woodDk = 0x5e3b1a;
    // пистолет 70×30
    let g = make();
    g.fillStyle(steel, 1);
    g.fillRoundedRect(10, 4, 56, 11, 3);
    g.fillStyle(steelHi, 1);
    g.fillRect(14, 5, 48, 3);
    g.fillStyle(0x2a2d31, 1);
    g.fillPoints([{ x: 12, y: 14 }, { x: 26, y: 14 }, { x: 22, y: 30 }, { x: 8, y: 30 }], true);
    g.lineStyle(3, steel, 1);
    g.strokeCircle(30, 17, 5);
    g.generateTexture('gun_pistol', 70, 30);
    g.destroy();
    // двустволка 130×26
    g = make();
    g.fillStyle(wood, 1);
    g.fillPoints([{ x: 0, y: 9 }, { x: 36, y: 6 }, { x: 36, y: 20 }, { x: 4, y: 26 }], true);
    g.fillStyle(woodDk, 1);
    g.fillRect(36, 6, 18, 14);
    g.fillStyle(steel, 1);
    g.fillRect(50, 4, 78, 6);
    g.fillRect(50, 11, 78, 6);
    g.fillStyle(steelHi, 1);
    g.fillRect(52, 5, 74, 2);
    g.fillRect(52, 12, 74, 2);
    g.generateTexture('gun_shotgun', 130, 26);
    g.destroy();
    // пулемётик 84×40
    g = make();
    g.fillStyle(steel, 1);
    g.fillRoundedRect(10, 6, 56, 16, 4);
    g.fillRect(64, 10, 18, 6);
    g.fillStyle(0x2a2d31, 1);
    g.fillRect(28, 20, 12, 18);
    g.fillRect(46, 20, 9, 18);
    g.fillStyle(steelHi, 1);
    g.fillRect(14, 8, 48, 3);
    g.generateTexture('gun_uzi', 84, 40);
    g.destroy();
    // револьвер 96×32
    g = make();
    g.fillStyle(0xb8bec6, 1);
    g.fillRect(30, 6, 62, 9);
    g.fillStyle(0x8d949c, 1);
    g.fillRoundedRect(20, 3, 22, 16, 4);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(32, 7, 58, 2);
    g.fillStyle(wood, 1);
    g.fillPoints([{ x: 14, y: 14 }, { x: 30, y: 14 }, { x: 26, y: 32 }, { x: 8, y: 32 }], true);
    g.generateTexture('gun_magnum', 96, 32);
    g.destroy();
  }

  // вспышка выстрела (конус вправо)
  {
    const g = make();
    g.fillStyle(0xffb020, 0.9);
    g.fillTriangle(0, 32, 64, 14, 64, 50);
    g.fillTriangle(0, 32, 40, 0, 46, 22);
    g.fillTriangle(0, 32, 40, 64, 46, 42);
    g.fillStyle(0xfff6c8, 1);
    g.fillTriangle(0, 32, 50, 22, 50, 42);
    g.fillCircle(6, 32, 8);
    g.generateTexture('flash', 64, 64);
    g.destroy();
  }

  // гильза и монетка
  {
    const g = make();
    g.fillStyle(0xd9a521, 1);
    g.fillRect(0, 0, 10, 5);
    g.fillStyle(0xfff0a0, 1);
    g.fillRect(1, 1, 8, 1);
    g.generateTexture('shell', 10, 5);
    g.destroy();
    const c = make();
    c.fillStyle(0xb8860b, 1);
    c.fillCircle(14, 14, 14);
    c.fillStyle(0xf2b822, 1);
    c.fillCircle(14, 13, 12);
    c.lineStyle(2, 0xffe58a, 1);
    c.strokeCircle(14, 13, 8);
    c.generateTexture('coin', 28, 28);
    c.destroy();
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
