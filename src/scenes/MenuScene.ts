import { W, H, FISH, ZoneDef } from '../data';
import { S, save, reelDepth, zone, best, speciesCount } from '../save';
import { hideBack, startTilt } from '../telegram';
import { button, gradient, money, txt } from '../ui';
import { sfx } from '../sound';

export const MENU_WATER = 700;

/** Фон меню в стиле зоны: небо, берег, вода, лодка или рыбак на льду. */
export function drawZoneBg(scene: PScene, z: ZoneDef, waterY: number): void {
  const g = scene.add.graphics();
  gradient(g, 0, 0, W, waterY, z.sky[0], z.sky[1]);
  gradient(g, 0, waterY, W, H - waterY, z.water[0], 0x0b2236);

  if (z.id === 'pond') {
    g.fillStyle(0xfff1b0, 1);
    g.fillCircle(580, 150, 60);
    g.fillStyle(0x5c8f3a, 1);
    g.fillEllipse(80, waterY + 4, 360, 60);
    g.fillEllipse(640, waterY + 4, 300, 46);
    g.fillStyle(0x3f6e28, 1);
    for (let i = 0; i < 9; i++) g.fillTriangle(20 + i * 30, waterY - 10, 35 + i * 30, waterY - 70 - (i % 3) * 20, 50 + i * 30, waterY - 10);
    scene.add.image(660, waterY - 70, 'reeds');
  } else if (z.id === 'volga') {
    g.fillStyle(0xfff4d0, 1);
    g.fillCircle(130, 170, 54);
    g.fillStyle(0xc9a86a, 1);
    g.fillRect(0, waterY - 90, W, 94);
    g.fillStyle(0x6b8a3e, 1);
    for (let i = 0; i < 14; i++) g.fillCircle(20 + i * 52, waterY - 96, 24);
    g.fillStyle(0xf2efe6, 1);
    g.fillRect(520, waterY - 190, 56, 96);
    g.fillRect(536, waterY - 246, 24, 56);
    g.fillStyle(0xd4a52a, 1);
    g.fillCircle(548, waterY - 256, 15);
    g.fillCircle(548, waterY - 192, 20);
  } else if (z.id === 'baikal') {
    g.fillStyle(0xdfe9f2, 1);
    g.fillTriangle(-40, waterY, 160, waterY - 300, 360, waterY);
    g.fillTriangle(260, waterY, 480, waterY - 380, 700, waterY);
    g.fillTriangle(520, waterY, 700, waterY - 240, 860, waterY);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(120, waterY - 230, 160, waterY - 300, 200, waterY - 230);
    g.fillTriangle(430, waterY - 300, 480, waterY - 380, 530, waterY - 300);
    // лёд
    g.fillStyle(0xcfe3f0, 1);
    g.fillRect(0, waterY + 6, W, 40);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, waterY + 6, W, 8);
    g.fillStyle(0x1d4a66, 1);
    g.fillEllipse(W / 2 + 95, waterY + 20, 120, 18);
  } else {
    g.fillStyle(0x5d6a74, 1);
    g.fillTriangle(-20, waterY, 90, waterY - 170, 220, waterY);
    g.fillTriangle(560, waterY, 650, waterY - 130, 760, waterY);
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 8; i++) g.fillEllipse(40 + i * 95, waterY + 6 + (i % 2) * 6, 70, 10);
  }
  if (z.id !== 'baikal') {
    g.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 6; i++) g.fillRect(60 + i * 110, waterY + 20 + (i % 3) * 18, 60, 3);
  }

  const c1 = scene.add.image(160, 230, 'cloud').setAlpha(0.9);
  const c2 = scene.add.image(520, 330, 'cloud').setScale(0.7).setAlpha(0.85);
  scene.tweens.add({ targets: c1, x: 220, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: c2, x: 470, duration: 11000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  if (z.id === 'baikal') {
    scene.add.image(W / 2 - 30, waterY - 60, 'icefisher');
  } else {
    const boat = scene.add.image(W / 2 - 30, waterY - 60, 'boat');
    scene.tweens.add({ targets: boat, y: waterY - 54, angle: 1.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}

export function depthLabel(z: ZoneDef): string {
  return z.depth === Infinity ? 'без дна' : `${z.depth} м`;
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideBack();
    const z = zone();
    drawZoneBg(this, z, MENU_WATER);

    txt(this, W / 2, 70, 'РЫБАЛКА ПРО', 72, '#ffffff', { fontStyle: 'bold', stroke: '#1d4f73', strokeThickness: 10 }).setOrigin(0.5);
    txt(this, W / 2, 140, `${z.name} · ${depthLabel(z)}`, 30, '#1d4f73', { fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 }).setOrigin(0.5);

    const totalSpecies = FISH.filter((f) => f.kind !== 'junk' && f.kind !== 'protected').length;
    const reel = reelDepth();

    const pg = this.add.graphics();
    pg.fillStyle(0x0b2236, 0.6);
    pg.fillRoundedRect(40, 760, W - 80, 120, 20);
    txt(this, 70, 778, 'Деньги', 22, '#9fd3ef');
    txt(this, 70, 806, money(S.d.money), 38, '#ffe58a', { fontStyle: 'bold' });
    const reelText = reel >= 99999 ? '∞' : `${reel} м`;
    txt(this, 380, 778, `Леска: ${reelText}`, 24, '#ffffff');
    txt(this, 380, 810, `Рекорд здесь: ${Math.floor(best(z.id))} м`, 24, '#ffffff');
    txt(this, 380, 842, `Видов: ${speciesCount()}/${totalSpecies}`, 24, '#ffffff');

    button(this, W / 2, 960, 520, 110, 'Закинуть удочку', () => {
      startTilt();
      sfx.cast();
      this.scene.start('Fishing');
    }, { size: 40 });
    button(this, W / 2 - 230, 1090, 200, 90, 'Карта', () => this.scene.start('Map'), { color: 0xf2d39a, size: 28 });
    button(this, W / 2, 1090, 200, 90, 'Магазин', () => this.scene.start('Shop'), { color: 0x7fd1a0, size: 28 });
    button(this, W / 2 + 230, 1090, 200, 90, 'Рыбопедия', () => this.scene.start('Fishopedia'), { color: 0x9fd3ef, size: 26 });

    const tiltLabel = () => (S.d.tiltOn ? (S.d.tiltInvert ? 'Наклон: инверсия' : 'Наклон: вкл') : 'Наклон: выкл');
    const tb = button(this, W / 2 - 135, 1205, 250, 64, tiltLabel(), () => {
      if (!S.d.tiltOn) S.d.tiltOn = true;
      else if (!S.d.tiltInvert) S.d.tiltInvert = true;
      else {
        S.d.tiltOn = false;
        S.d.tiltInvert = false;
      }
      if (S.d.tiltOn) startTilt();
      tb.setLabel(tiltLabel());
      save();
    }, { color: 0xd8dde2, size: 24 });
    const sb = button(this, W / 2 + 135, 1205, 250, 64, S.d.sound ? 'Звук: вкл' : 'Звук: выкл', () => {
      S.d.sound = !S.d.sound;
      sb.setLabel(S.d.sound ? 'Звук: вкл' : 'Звук: выкл');
      save();
    }, { color: 0xd8dde2, size: 24 });
  }
}
