import { W, H, FISH, ZONE_DEPTH } from '../data';
import { S, save, reelDepth } from '../save';
import { hideBack, startTilt } from '../telegram';
import { button, gradient, money, txt } from '../ui';
import { sfx } from '../sound';

export const MENU_WATER = 700;

/** Общий фон «лодка на пруду» — используется в меню, магазине, рыбопедии. */
export function drawPond(scene: PScene, waterY: number, withBoat = true): void {
  const g = scene.add.graphics();
  gradient(g, 0, 0, W, waterY, 0x6fbde6, 0xcdeaf5);
  gradient(g, 0, waterY, W, H - waterY, 0x3f93c4, 0x0b2236);
  g.fillStyle(0xfff1b0, 1);
  g.fillCircle(580, 150, 60);
  g.fillStyle(0x5c8f3a, 1);
  g.fillEllipse(80, waterY + 4, 360, 60); // дальний берег
  g.fillEllipse(640, waterY + 4, 300, 46);
  g.fillStyle(0x3f6e28, 1);
  for (let i = 0; i < 9; i++) g.fillTriangle(20 + i * 30, waterY - 10, 35 + i * 30, waterY - 70 - (i % 3) * 20, 50 + i * 30, waterY - 10);
  g.fillStyle(0xffffff, 0.35);
  for (let i = 0; i < 6; i++) g.fillRect(60 + i * 110, waterY + 20 + (i % 3) * 18, 60, 3);

  const c1 = scene.add.image(160, 230, 'cloud').setAlpha(0.9);
  const c2 = scene.add.image(520, 330, 'cloud').setScale(0.7).setAlpha(0.85);
  scene.tweens.add({ targets: c1, x: 220, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: c2, x: 470, duration: 11000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.add.image(660, waterY - 70, 'reeds');

  if (withBoat) {
    const boat = scene.add.image(W / 2 - 30, waterY - 60, 'boat');
    scene.tweens.add({ targets: boat, y: waterY - 54, angle: 1.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideBack();
    drawPond(this, MENU_WATER);

    txt(this, W / 2, 70, 'РЫБАЛКА ПРО', 72, '#ffffff', { fontStyle: 'bold', stroke: '#1d4f73', strokeThickness: 10 }).setOrigin(0.5);
    txt(this, W / 2, 140, 'Зона 1 · Родной пруд', 30, '#1d4f73', { fontStyle: 'bold' }).setOrigin(0.5);

    const caughtSpecies = FISH.filter((f) => f.kind !== 'junk' && (S.d.caught[f.id] || 0) > 0).length;
    const totalSpecies = FISH.filter((f) => f.kind !== 'junk').length;

    // панель статистики
    const pg = this.add.graphics();
    pg.fillStyle(0x0b2236, 0.55);
    pg.fillRoundedRect(40, 760, W - 80, 120, 20);
    txt(this, 70, 778, 'Деньги', 22, '#9fd3ef');
    txt(this, 70, 806, money(S.d.money), 38, '#ffe58a', { fontStyle: 'bold' });
    txt(this, 400, 778, `Леска: ${reelDepth()} м из ${ZONE_DEPTH}`, 24, '#ffffff');
    txt(this, 400, 810, `Рекорд: ${Math.floor(S.d.bestDepth)} м`, 24, '#ffffff');
    txt(this, 400, 842, `Рыбопедия: ${caughtSpecies}/${totalSpecies}`, 24, '#ffffff');

    button(this, W / 2, 960, 520, 110, 'Закинуть удочку', () => {
      startTilt();
      sfx.cast();
      this.scene.start('Fishing');
    }, { size: 40 });
    button(this, W / 2 - 135, 1090, 250, 90, 'Магазин', () => this.scene.start('Shop'), { color: 0x7fd1a0 });
    button(this, W / 2 + 135, 1090, 250, 90, 'Рыбопедия', () => this.scene.start('Fishopedia'), { color: 0x9fd3ef });

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
