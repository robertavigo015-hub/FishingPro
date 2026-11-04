import { W, H, ZONES, FISH } from '../data';
import { S, save, zoneUnlocked, speciesCount, best, reelDepth } from '../save';
import { showBack } from '../telegram';
import { button, gradient, txt } from '../ui';
import { depthLabel } from './MenuScene';

const ICON: Record<string, string> = { none: '🎣', current: '🌊', ice: '❄️', endless: '🌌' };

export class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    const back = () => this.scene.start('Menu');
    showBack(back);
    const g = this.add.graphics();
    gradient(g, 0, 0, W, H, 0x2c5f7c, 0x0b2236);
    txt(this, 40, 30, 'Карта', 54, '#ffffff', { fontStyle: 'bold' });
    txt(this, W - 40, 48, `Видов поймано: ${speciesCount()}`, 26, '#ffe58a', { fontStyle: 'bold' }).setOrigin(1, 0);

    const cardH = 236;
    ZONES.forEach((z, i) => {
      const y = 110 + i * (cardH + 16);
      const open = zoneUnlocked(z);
      const here = S.d.zone === z.id;
      const cg = this.add.graphics();
      // мини-пейзаж зоны
      gradient(cg, 30, y, W - 60, 90, z.sky[0], z.sky[1], 10);
      gradient(cg, 30, y + 90, W - 60, cardH - 90, z.water[0], z.water[1], 14);
      if (!open) {
        cg.fillStyle(0x0b2236, 0.6);
        cg.fillRect(30, y, W - 60, cardH);
      }
      cg.lineStyle(here ? 5 : 2, here ? 0xf2b822 : 0xffffff, here ? 1 : 0.35);
      cg.strokeRoundedRect(30, y, W - 60, cardH, 18);

      txt(this, 54, y + 18, `${ICON[z.mechanic]} ${z.name}`, 34, '#ffffff', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 6 });
      txt(this, W - 54, y + 26, depthLabel(z), 26, '#ffffff', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 5 }).setOrigin(1, 0);
      txt(this, 54, y + 104, z.about, 21, '#e8f1f6', { wordWrap: { width: W - 340 }, stroke: '#0b2236', strokeThickness: 3 });

      const species = FISH.filter((f) => f.zone === z.id && f.kind !== 'junk' && f.kind !== 'protected');
      const caught = species.filter((f) => (S.d.caught[f.id] || 0) > 0).length;
      const info = open
        ? `Рекорд ${Math.floor(best(z.id))} м · видов ${caught}/${species.length}`
        : `Нужно ${z.unlock} видов (у вас ${speciesCount()})`;
      txt(this, 54, y + cardH - 42, info, 22, open ? '#ffe58a' : '#ff9a8a', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 4 });

      if (open) {
        const label = here ? 'Вы здесь' : 'Плыть';
        const b = button(this, W - 150, y + cardH - 72, 200, 76, label, () => {
          S.d.zone = z.id;
          save();
          this.scene.start('Menu');
        }, { color: here ? 0x9fd3ef : 0xf2b822, size: 28 });
        if (here) b.setEnabled(false);
        if (z.depth !== Infinity && reelDepth() < z.depth) {
          txt(this, W - 150, y + cardH - 128, `леска до дна: ${z.depth} м`, 18, '#ffffff', { stroke: '#0b2236', strokeThickness: 4 }).setOrigin(0.5);
        }
      } else {
        txt(this, W - 150, y + cardH - 72, '🔒', 52).setOrigin(0.5);
      }
    });
    button(this, W / 2, H - 70, 360, 80, 'На лодку', back, { color: 0x9fd3ef });
  }
}
