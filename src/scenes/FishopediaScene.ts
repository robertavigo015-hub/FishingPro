import { W, H, FISH, ZONES, ZoneId } from '../data';
import { S, zoneUnlocked } from '../save';
import { showBack } from '../telegram';
import { button, gradient, money, txt } from '../ui';

const SHORT: Record<ZoneId, string> = { pond: 'Пруд', volga: 'Волга', baikal: 'Байкал', barents: 'Море' };

export class FishopediaScene extends Phaser.Scene {
  private tab: ZoneId = 'pond';

  constructor() {
    super('Fishopedia');
  }

  init(data: { tab?: ZoneId }): void {
    this.tab = data?.tab || S.d.zone || 'pond';
  }

  create(): void {
    const back = () => this.scene.start('Menu');
    showBack(back);
    const g = this.add.graphics();
    gradient(g, 0, 0, W, H, 0x2a7a6a, 0x0b2236);
    const list = FISH.filter((f) => f.zone === this.tab);
    const known = list.filter((f) => (S.d.caught[f.id] || 0) > 0).length;
    txt(this, 40, 24, 'Рыбопедия', 50, '#ffffff', { fontStyle: 'bold' });
    txt(this, W - 40, 38, `${known}/${list.length}`, 34, '#ffe58a', { fontStyle: 'bold' }).setOrigin(1, 0);

    // вкладки зон
    const tw = (W - 60 - 30) / 4;
    ZONES.forEach((z, i) => {
      const open = zoneUnlocked(z);
      const b = button(this, 30 + tw / 2 + i * (tw + 10), 122, tw, 56, open ? SHORT[z.id] : '🔒', () => this.scene.restart({ tab: z.id }), {
        color: z.id === this.tab ? 0xf2b822 : 0x9fd3ef, size: 24,
      });
      if (!open) b.setEnabled(false);
    });

    const cols = 2;
    const cardW = (W - 90) / cols;
    const rows = Math.ceil(list.length / cols);
    const top = 168;
    const avail = H - top - 20;
    const cardH = Math.min(140, Math.floor(avail / rows) - 8);
    list.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 30 + col * (cardW + 30);
      const y = top + row * (cardH + 8);
      const n = S.d.caught[f.id] || 0;
      const bad = f.kind === 'junk' || f.kind === 'protected';
      const cg = this.add.graphics();
      cg.fillStyle(f.kind === 'protected' ? 0x2a5a8a : bad ? 0x5a2a2a : 0xffffff, bad ? 0.35 : 0.1);
      cg.fillRoundedRect(x, y, cardW, cardH, 14);

      const img = this.add.image(x + 58, y + 38, 'fish_' + f.id);
      const s = Math.min(96 / img.width, 52 / img.height, 1.4);
      img.setScale(s);
      if (!n && f.kind !== 'protected') img.setTint(0x000000).setAlpha(0.6);

      const shown = n > 0 || f.kind === 'protected';
      txt(this, x + 118, y + 8, shown ? f.name : '???', 22, '#ffffff', { fontStyle: 'bold', wordWrap: { width: cardW - 124 } });
      const valColor = f.value < 0 ? '#ff8a7a' : '#ffe58a';
      const valText = f.kind === 'protected' ? `Штраф −${money(Math.abs(f.value))}` : `${f.value > 0 ? '' : '−'}${money(Math.abs(f.value))}`;
      txt(this, x + 118, y + 40, shown ? `${valText}${n ? ` · ${n} шт.` : ''}` : '', 17, valColor);
      txt(this, x + 14, y + 72, shown ? f.desc : f.hint, 16, '#c9dbe6', { wordWrap: { width: cardW - 28 } });
    });
  }
}
