import { FONT } from './data';
import { sfx } from './sound';
import { haptic } from './telegram';

export function txt(scene: PScene, x: number, y: number, s: string, size: number, color = '#ffffff', extra: Record<string, unknown> = {}): PText {
  return scene.add.text(x, y, s, {
    fontFamily: FONT,
    fontSize: size + 'px',
    color,
    ...extra,
  });
}

export interface Button {
  c: PContainer;
  setLabel(s: string): void;
  setEnabled(on: boolean): void;
}

export function button(
  scene: PScene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  opts: { color?: number; size?: number; textColor?: string } = {},
): Button {
  const color = opts.color ?? 0xf2b822;
  const g = scene.add.graphics();
  const t = txt(scene, 0, 0, label, opts.size ?? 30, opts.textColor ?? '#2b1a05', { fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
  let enabled = true;
  const draw = (pressed: boolean) => {
    g.clear();
    const c = enabled ? color : 0x8a8f94;
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 18);
    g.fillStyle(c, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, 18);
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(-w / 2 + 8, -h / 2 + 6 + (pressed ? 4 : 0), w - 16, h * 0.32, 12);
    t.y = pressed ? 4 : 0;
  };
  draw(false);
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  const c = scene.add.container(x, y, [g, t, zone]);
  zone.on('pointerdown', () => enabled && draw(true));
  zone.on('pointerout', () => draw(false));
  zone.on('pointerup', () => {
    draw(false);
    if (!enabled || scene.__dragged) return; // прокрутка списка, а не нажатие
    sfx.click();
    haptic('light');
    onClick();
  });
  return {
    c,
    setLabel(s: string) {
      t.setText(s);
    },
    setEnabled(on: boolean) {
      enabled = on;
      draw(false);
    },
  };
}

/** Вертикальный градиент полосами (работает и на WebGL, и на Canvas). */
export function gradient(g: PGraphics, x: number, y: number, w: number, h: number, top: number, bottom: number, bands = 40): void {
  const tr = (top >> 16) & 255, tg = (top >> 8) & 255, tb = top & 255;
  const br = (bottom >> 16) & 255, bg = (bottom >> 8) & 255, bb = bottom & 255;
  const bh = h / bands;
  for (let i = 0; i < bands; i++) {
    const k = i / (bands - 1);
    const c = (Math.round(tr + (br - tr) * k) << 16) | (Math.round(tg + (bg - tg) * k) << 8) | Math.round(tb + (bb - tb) * k);
    g.fillStyle(c, 1);
    g.fillRect(x, y + i * bh, w, bh + 1);
  }
}

export function money(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}
