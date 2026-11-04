import { W, H, SHOP, CAT_NAMES, ShopCat, SHOP_BY_ID } from '../data';
import { S, save, owns } from '../save';
import { showBack, haptic } from '../telegram';
import { button, Button, gradient, money, txt } from '../ui';
import { sfx } from '../sound';

const HEADER = 120;

export class ShopScene extends Phaser.Scene {
  private moneyText!: PText;
  private rows: { id: string; btn: Button }[] = [];
  private contentH = 0;

  constructor() {
    super('Shop');
  }

  create(): void {
    const back = () => this.scene.start('Menu');
    showBack(back);
    this.rows = [];
    const bg = this.add.graphics().setScrollFactor(0);
    gradient(bg, 0, 0, W, H, 0x1f5f86, 0x0b2236);

    let y = HEADER + 16;
    const cats: ShopCat[] = ['reel', 'gun', 'tech', 'wear'];
    for (const cat of cats) {
      txt(this, 40, y, CAT_NAMES[cat].toUpperCase(), 24, '#9fd3ef', { fontStyle: 'bold' });
      y += 38;
      for (const it of SHOP.filter((s) => s.cat === cat)) {
        const rg = this.add.graphics();
        rg.fillStyle(0xffffff, 0.08);
        rg.fillRoundedRect(30, y, W - 60, 78, 14);
        txt(this, 50, y + 8, it.name, 27, '#ffffff', { fontStyle: 'bold' });
        txt(this, 50, y + 40, it.desc, 17, '#c9dbe6', { wordWrap: { width: W - 290 }, lineSpacing: -2 });
        const btn = button(this, W - 130, y + 39, 180, 54, '', () => this.act(it.id), { size: 22 });
        this.rows.push({ id: it.id, btn });
        y += 86;
      }
      y += 6;
    }
    button(this, W / 2, y + 50, 360, 84, 'На лодку', back, { color: 0x9fd3ef });
    this.contentH = y + 120;

    // шапка поверх списка
    const head = this.add.graphics().setScrollFactor(0).setDepth(10);
    head.fillStyle(0x163f5c, 1);
    head.fillRect(0, 0, W, HEADER);
    head.fillStyle(0x000000, 0.25);
    head.fillRect(0, HEADER, W, 6);
    this.add.zone(W / 2, HEADER / 2, W, HEADER).setScrollFactor(0).setDepth(10).setInteractive();
    txt(this, 40, 32, 'Магазин', 54, '#ffffff', { fontStyle: 'bold' }).setScrollFactor(0).setDepth(11);
    this.moneyText = txt(this, W - 40, 46, money(S.d.money), 38, '#ffe58a', { fontStyle: 'bold' }).setOrigin(1, 0).setScrollFactor(0).setDepth(11);

    this.setupScroll();
    this.refresh();
  }

  private setupScroll(): void {
    const cam = this.cameras.main;
    const maxScroll = Math.max(0, this.contentH - H);
    let startY = 0;
    let startScroll = 0;
    let vel = 0;
    let lastY = 0;
    (this as any).__dragged = false;
    this.input.on('pointerdown', (p: PPointer) => {
      startY = p.y;
      lastY = p.y;
      startScroll = cam.scrollY;
      vel = 0;
      (this as any).__dragged = false;
    });
    this.input.on('pointermove', (p: PPointer) => {
      if (!p.isDown) return;
      if (Math.abs(p.y - startY) > 12) (this as any).__dragged = true;
      if ((this as any).__dragged) {
        cam.scrollY = Phaser.Math.Clamp(startScroll - (p.y - startY), 0, maxScroll);
        vel = lastY - p.y;
        lastY = p.y;
      }
    });
    this.input.on('pointerup', () => {
      // инерция после свайпа
      if ((this as any).__dragged && Math.abs(vel) > 2) {
        this.tweens.addCounter({
          from: 0, to: 1, duration: 400, ease: 'Quad.out',
          onUpdate: (tw: any) => {
            cam.scrollY = Phaser.Math.Clamp(cam.scrollY + vel * 2 * (1 - tw.getValue()), 0, maxScroll);
          },
        });
      }
    });
    this.input.on('wheel', (_p: PPointer, _o: unknown, _dx: number, dy: number) => {
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy, 0, maxScroll);
    });
  }

  private state(id: string): { label: string; enabled: boolean } {
    const it = SHOP_BY_ID[id];
    if (it.cat === 'gun' && owns(id)) return S.d.gun === id ? { label: 'В руках', enabled: false } : { label: 'Взять', enabled: true };
    if (owns(id)) return { label: 'Есть', enabled: false };
    if (it.requires && !owns(it.requires)) {
      const need = SHOP_BY_ID[it.requires].name.replace('Леска ', '');
      return { label: '🔒 ' + (need.length > 10 ? need.slice(0, 9) + '…' : need), enabled: false };
    }
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
