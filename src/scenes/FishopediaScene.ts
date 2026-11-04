import { W, H, FISH } from '../data';
import { S } from '../save';
import { showBack } from '../telegram';
import { button, gradient, money, txt } from '../ui';

export class FishopediaScene extends Phaser.Scene {
  constructor() {
    super('Fishopedia');
  }

  create(): void {
    const back = () => this.scene.start('Menu');
    showBack(back);
    const g = this.add.graphics();
    gradient(g, 0, 0, W, H, 0x2a7a6a, 0x0b2236);
    const known = FISH.filter((f) => (S.d.caught[f.id] || 0) > 0).length;
    txt(this, 40, 30, 'Рыбопедия', 54, '#ffffff', { fontStyle: 'bold' });
    txt(this, W - 40, 46, `${known}/${FISH.length}`, 36, '#ffe58a', { fontStyle: 'bold' }).setOrigin(1, 0);

    const cardW = (W - 90) / 2;
    const cardH = 140;
    FISH.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 30 + col * (cardW + 30);
      const y = 110 + row * (cardH + 10);
      const n = S.d.caught[f.id] || 0;
      const cg = this.add.graphics();
      cg.fillStyle(f.kind === 'junk' ? 0x5a2a2a : 0xffffff, f.kind === 'junk' ? 0.35 : 0.1);
      cg.fillRoundedRect(x, y, cardW, cardH, 14);

      const img = this.add.image(x + 60, y + 42, 'fish_' + f.id);
      const s = Math.min(100 / img.width, 60 / img.height, 1.4);
      img.setScale(s);
      if (!n) img.setTint(0x000000).setAlpha(0.6);

      txt(this, x + 124, y + 10, n ? f.name : '???', 24, '#ffffff', { fontStyle: 'bold', wordWrap: { width: cardW - 130 } });
      const valColor = f.value < 0 ? '#ff8a7a' : '#ffe58a';
      txt(this, x + 124, y + 42, n ? `${f.value > 0 ? '' : '−'}${money(Math.abs(f.value))} · ${n} шт.` : '', 19, valColor);
      txt(this, x + 14, y + 82, n ? f.desc : f.hint, 17, '#c9dbe6', { wordWrap: { width: cardW - 28 } });
    });

    button(this, W / 2, H - 60, 360, 80, 'На лодку', back, { color: 0x9fd3ef });
  }
}
