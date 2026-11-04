import { W, H, SHOP, CAT_NAMES, ShopCat, SHOP_BY_ID } from '../data';
import { S, save, owns } from '../save';
import { showBack } from '../telegram';
import { button, Button, gradient, money, txt } from '../ui';
import { sfx } from '../sound';
import { haptic } from '../telegram';

export class ShopScene extends Phaser.Scene {
  private moneyText!: PText;
  private rows: { id: string; btn: Button }[] = [];

  constructor() {
    super('Shop');
  }

  create(): void {
    const back = () => this.scene.start('Menu');
    showBack(back);
    this.rows = [];
    const g = this.add.graphics();
    gradient(g, 0, 0, W, H, 0x1f5f86, 0x0b2236);

    txt(this, 40, 36, 'Магазин', 54, '#ffffff', { fontStyle: 'bold' });
    this.moneyText = txt(this, W - 40, 50, money(S.d.money), 38, '#ffe58a', { fontStyle: 'bold' }).setOrigin(1, 0);

    let y = 130;
    const cats: ShopCat[] = ['reel', 'gun', 'tech', 'wear'];
    for (const cat of cats) {
      txt(this, 40, y, CAT_NAMES[cat].toUpperCase(), 24, '#9fd3ef', { fontStyle: 'bold' });
      y += 38;
      for (const it of SHOP.filter((s) => s.cat === cat)) {
        const rg = this.add.graphics();
        rg.fillStyle(0xffffff, 0.08);
        rg.fillRoundedRect(30, y, W - 60, 70, 14);
        txt(this, 50, y + 8, it.name, 28, '#ffffff', { fontStyle: 'bold' });
        txt(this, 50, y + 42, it.desc, 19, '#c9dbe6');
        const btn = button(this, W - 130, y + 35, 180, 54, '', () => this.act(it.id), { size: 24 });
        this.rows.push({ id: it.id, btn });
        y += 80;
      }
      y += 6;
    }
    button(this, W / 2, H - 70, 360, 84, 'На лодку', back, { color: 0x9fd3ef });
    this.refresh();
  }

  private state(id: string): { label: string; enabled: boolean } {
    const it = SHOP_BY_ID[id];
    if (it.cat === 'gun' && owns(id)) return S.d.gun === id ? { label: 'В руках', enabled: false } : { label: 'Взять', enabled: true };
    if (owns(id)) return { label: 'Есть', enabled: false };
    if (it.requires && !owns(it.requires)) return { label: 'Сначала ' + SHOP_BY_ID[it.requires].name.replace('Леска ', ''), enabled: false };
    return { label: money(it.cost), enabled: S.d.money >= it.cost };
  }

  private refresh(): void {
    this.moneyText.setText(money(S.d.money));
    for (const r of this.rows) {
      const st = this.state(r.id);
      r.btn.setLabel(st.label);
      r.btn.setEnabled(st.enabled);
    }
  }

  private act(id: string): void {
    const it = SHOP_BY_ID[id];
    if (it.cat === 'gun' && owns(id)) {
      S.d.gun = id;
    } else if (!owns(id) && S.d.money >= it.cost) {
      S.d.money -= it.cost;
      S.d.owned.push(id);
      if (it.cat === 'gun') S.d.gun = id;
      sfx.coin();
      haptic('success');
    }
    save();
    this.refresh();
  }
}
