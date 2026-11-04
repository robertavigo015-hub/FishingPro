import { W, H, PPM, WATER_Y, ZONE_DEPTH, FISH, FISH_BY_ID, FishDef } from '../data';
import { S, save, owns, reelDepth, currentGun, priceMult } from '../save';
import { getTilt, haptic, hideBack } from '../telegram';
import { button, gradient, money, txt } from '../ui';
import { sfx } from '../sound';

type FState = 'swim' | 'hooked' | 'air' | 'dead' | 'lost';
type Phase = 'intro' | 'descent' | 'ascent' | 'launch' | 'results';

interface FishObj {
  def: FishDef;
  spr: PImage;
  vx: number;
  vy: number;
  hp: number;
  st: FState;
  ox: number;
  oy: number;
  spin: number;
  ph: number;
}

const FALL_MAX = 360;
const FALL_ACC = 900;
const LAT = 560;
const ASC_START = 170;
const ASC_ACC = 130;
const ASC_MAX = 950;
const MAGNET = 70;
const GRAV = 650;
const BOTTOM_Y = WATER_Y + ZONE_DEPTH * PPM;
const ROD_TIP = { x: W / 2 - 30 - 145 + 270, y: WATER_Y - 60 - 90 + 8 };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class FishingScene extends Phaser.Scene {
  private phase: Phase = 'intro';
  private fish: FishObj[] = [];
  private hooked: FishObj[] = [];
  private lure!: PImage;
  private lureVX = 0;
  private lureVY = 0;
  private lineG!: PGraphics;
  private barG!: PGraphics;
  private dark!: PImage;
  private glow!: PImage;
  private cross!: PImage;
  private depthText!: PText;
  private subText!: PText;
  private rightText!: PText;
  private msgText!: PText;
  private keys: any;
  private toasterReady = false;
  private runMoney = 0;
  private killed: Record<string, number> = {};
  private lastShot: Record<number, number> = {};
  private ending = false;
  private maxDepth = 0;
  private camLocked = false;
  private bubbleT = 0;
  private lineLimitY = 0;

  constructor() {
    super('Fishing');
  }

  create(): void {
    hideBack();
    this.phase = 'intro';
    this.fish = [];
    this.hooked = [];
    this.lureVX = 0;
    this.lureVY = 0;
    this.toasterReady = owns('toaster');
    this.runMoney = 0;
    this.killed = {};
    this.lastShot = {};
    this.ending = false;
    this.maxDepth = 0;
    this.camLocked = false;
    this.lineLimitY = WATER_Y + Math.min(reelDepth(), ZONE_DEPTH) * PPM - 14;

    this.drawWorld();
    this.spawn();

    this.lineG = this.add.graphics().setDepth(19);
    this.lure = this.add.image(ROD_TIP.x, ROD_TIP.y, 'lure').setDepth(20).setOrigin(0.5, 0.15);
    this.glow = this.add.image(0, 0, 'glow').setDepth(51).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0);
    this.dark = this.add.rectangle(0, 0, W, H, 0x02070f, 1).setOrigin(0).setScrollFactor(0).setDepth(50).setAlpha(0);
    this.cross = this.add.image(0, 0, 'cross').setDepth(90).setVisible(false);

    // HUD
    this.depthText = txt(this, 28, 22, '0 м', 52, '#ffffff', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 8 }).setScrollFactor(0).setDepth(100);
    this.subText = txt(this, 30, 86, `леска ${reelDepth()} м`, 24, '#ffffff', { stroke: '#0b2236', strokeThickness: 5 }).setScrollFactor(0).setDepth(100);
    this.rightText = txt(this, W - 28, 26, '', 40, '#ffe58a', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 8 }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.msgText = txt(this, W / 2, 330, '', 34, '#ffffff', { fontStyle: 'bold', align: 'center', stroke: '#0b2236', strokeThickness: 8, wordWrap: { width: W - 80 } })
      .setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    this.barG = this.add.graphics().setScrollFactor(0).setDepth(100);

    this.keys = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;

    const cam = this.cameras.main;
    cam.setScroll(0, WATER_Y - 760);

    // заброс
    this.tweens.add({
      targets: this.lure,
      x: ROD_TIP.x,
      y: WATER_Y + 12,
      duration: 500,
      ease: 'Quad.in',
      onComplete: () => {
        this.splash(this.lure.x, WATER_Y, 8);
        sfx.splash();
        this.phase = 'descent';
        if (S.d.bestDepth < 40) this.say('Уворачивайтесь от рыб!\nНаклон телефона, палец или ←/→', 3000);
      },
    });
  }

  // ---------- мир ----------
  private drawWorld(): void {
    const g = this.add.graphics().setDepth(0);
    gradient(g, 0, 0, W, WATER_Y, 0x6fbde6, 0xcdeaf5, 30);
    gradient(g, 0, WATER_Y, W, BOTTOM_Y - WATER_Y + 40, 0x3f93c4, 0x061420, 90);
    g.fillStyle(0xfff1b0, 1);
    g.fillCircle(580, 260, 64);
    g.fillStyle(0x5c8f3a, 1);
    g.fillEllipse(90, WATER_Y + 4, 380, 60);
    g.fillEllipse(650, WATER_Y + 4, 300, 46);
    // дно
    g.fillStyle(0x3b3222, 1);
    g.fillRect(0, BOTTOM_Y + 30, W, 400);
    g.fillStyle(0x4a3f2b, 1);
    for (let i = 0; i < 12; i++) g.fillEllipse(i * 66 + 20, BOTTOM_Y + 34, 90, 30);
    // отметки глубины
    for (let d = 25; d < ZONE_DEPTH; d += 25) {
      const y = WATER_Y + d * PPM;
      g.fillStyle(0xffffff, d % 50 === 0 ? 0.18 : 0.08);
      g.fillRect(0, y, d % 50 === 0 ? 46 : 24, 3);
      if (d % 50 === 0) txt(this, 52, y - 12, d + ' м', 20, '#ffffff').setAlpha(0.3).setDepth(1);
    }
    this.add.image(120, 100, 'cloud').setDepth(1);
    this.add.image(470, 420, 'cloud').setScale(0.8).setDepth(1);
    this.add.image(660, WATER_Y - 70, 'reeds').setDepth(2);
    for (let i = 0; i < 8; i++) this.add.image(40 + i * 92, BOTTOM_Y - 30, 'weed').setDepth(3).setScale(rnd(0.8, 1.3));
    const boat = this.add.image(W / 2 - 30, WATER_Y - 60, 'boat').setDepth(25);
    this.tweens.add({ targets: boat, y: WATER_Y - 55, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // линия воды поверх лодки
    const wg = this.add.graphics().setDepth(26);
    wg.fillStyle(0x3f93c4, 0.55);
    wg.fillRect(0, WATER_Y, W, 14);
  }

  private spawn(): void {
    for (const def of FISH) {
      if (def.kind === 'boss') {
        this.place(def, def.midD, W / 2);
        continue;
      }
      if (def.kind === 'rare') {
        if (Math.random() < (def.odds ?? 0)) this.place(def, rnd(def.minD, def.maxD));
        continue;
      }
      let acc = Math.random();
      for (let d = def.minD; d < def.maxD; d += 10) {
        const k = d < def.midD ? (d - def.minD) / Math.max(1, def.midD - def.minD) : (def.maxD - d) / Math.max(1, def.maxD - def.midD);
        acc += (def.perHundred / 10) * (0.25 + 0.75 * clamp(k, 0, 1));
        while (acc >= 1) {
          acc -= 1;
          const dd = d + Math.random() * 10;
          if (dd >= 7 && dd < ZONE_DEPTH - 4) this.place(def, dd);
        }
      }
    }
  }

  private place(def: FishDef, depth: number, x?: number): void {
    const px = x ?? rnd(def.w / 2 + 10, W - def.w / 2 - 10);
    const spr = this.add.image(px, WATER_Y + depth * PPM, 'fish_' + def.id).setDepth(def.kind === 'boss' ? 9 : 10);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const vx = def.speed * rnd(0.6, 1) * dir;
    spr.setFlipX(vx < 0);
    this.fish.push({ def, spr, vx, vy: 0, hp: def.hp, st: 'swim', ox: 0, oy: 0, spin: 0, ph: Math.random() * 6 });
  }

  // ---------- цикл ----------
  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;

    this.updateSwimmers(dt, cam.scrollY, time);

    if (this.phase === 'descent') this.updateDescent(dt, time);
    else if (this.phase === 'ascent') this.updateAscent(dt, time);
    else if (this.phase === 'launch') this.updateLaunch(dt, time);

    // камера
    if (!this.camLocked) {
      let target = cam.scrollY;
      if (this.phase === 'descent') target = this.lure.y - 400;
      if (this.phase === 'ascent') target = this.lure.y - 880;
      target = clamp(target, 0, BOTTOM_Y + 300 - H);
      cam.scrollY += (target - cam.scrollY) * Math.min(1, dt * 7);
    }

    // леска
    this.lineG.clear();
    if (this.phase === 'intro' || this.phase === 'descent' || this.phase === 'ascent') {
      this.lineG.lineStyle(2, 0xffffff, 0.75);
      this.lineG.lineBetween(ROD_TIP.x, ROD_TIP.y, this.lure.x, this.lure.y);
    }

    // темнота и свет
    const camDepth = (cam.scrollY + H / 2 - WATER_Y) / PPM;
    const darkA = clamp(camDepth / ZONE_DEPTH, 0, 1) * 0.68 * (owns('lamp') ? 0.45 : 1);
    this.dark.setAlpha(darkA);
    this.glow.setPosition(this.lure.x, this.lure.y + 10).setAlpha(this.lure.y > WATER_Y ? darkA * 1.1 : 0);

    this.updateHud();
  }

  private updateHud(): void {
    const depth = Math.max(0, (this.lure.y - WATER_Y) / PPM);
    if (this.phase !== 'launch' && this.phase !== 'results') this.depthText.setText(Math.floor(depth) + ' м');
    if (this.phase === 'ascent') this.rightText.setText('Улов: ' + this.hooked.length);
    if (this.phase === 'launch' || this.phase === 'results') {
      this.rightText.setText((this.runMoney >= 0 ? '+' : '−') + money(Math.abs(this.runMoney)));
      this.rightText.setColor(this.runMoney >= 0 ? '#ffe58a' : '#ff8a7a');
    }
    // шкала глубины
    const g = this.barG;
    g.clear();
    if (this.phase === 'descent' || this.phase === 'ascent' || this.phase === 'intro') {
      const x = W - 26, y0 = 120, h = 520;
      g.fillStyle(0x0b2236, 0.5);
      g.fillRoundedRect(x - 8, y0 - 8, 16, h + 16, 8);
      const lim = Math.min(reelDepth(), ZONE_DEPTH) / ZONE_DEPTH;
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(x - 3, y0, 6, h * lim);
      g.fillStyle(0xf2b822, 1);
      g.fillCircle(x, y0 + h * clamp(depth / ZONE_DEPTH, 0, 1), 9);
      if (S.d.bestDepth > 0) {
        g.fillStyle(0xd9533b, 1);
        g.fillRect(x - 12, y0 + h * clamp(S.d.bestDepth / ZONE_DEPTH, 0, 1) - 2, 24, 4);
      }
    }
  }

  private updateSwimmers(dt: number, scrollY: number, time: number): void {
    for (const f of this.fish) {
      if (f.st !== 'swim') continue;
      if (Math.abs(f.spr.y - scrollY - H / 2) > H * 1.4) continue;
      const hw = f.def.w / 2 + 4;
      f.spr.x += f.vx * dt;
      if (f.spr.x < hw) {
        f.vx = Math.abs(f.vx);
        f.spr.setFlipX(false);
      } else if (f.spr.x > W - hw) {
        f.vx = -Math.abs(f.vx);
        f.spr.setFlipX(true);
      }
      if (f.def.kind === 'junk') f.spr.rotation = Math.sin(time / 900 + f.ph) * 0.4;
    }
  }

  private steer(dt: number, time: number): void {
    let desired = 0;
    const p = this.input.activePointer;
    const key = this.keys ? (this.keys.left.isDown ? -1 : 0) + (this.keys.right.isDown ? 1 : 0) : 0;
    const tilt = S.d.tiltOn ? getTilt(S.d.tiltInvert) : null;
    if (p.isDown) desired = clamp((p.x - this.lure.x) * 7, -LAT, LAT);
    else if (key) desired = key * LAT;
    else if (tilt !== null && Math.abs(tilt) > 0.06) desired = tilt * LAT;
    // инерция — приманка слегка «непослушная»
    this.lureVX += (desired - this.lureVX) * Math.min(1, dt * 6);
    this.lure.x = clamp(this.lure.x + this.lureVX * dt + Math.sin(time / 280) * 0.5, 18, W - 18);
    this.lure.rotation = (-this.lureVX / LAT) * 0.35;
  }

  private touches(f: FishObj, extra = 0): boolean {
    const dx = Math.abs(f.spr.x - this.lure.x);
    const dy = Math.abs(f.spr.y - (this.lure.y + 22));
    return dx < f.def.w * 0.42 + 8 + extra && dy < f.def.h * 0.42 + 10 + extra;
  }

  private updateDescent(dt: number, time: number): void {
    this.steer(dt, time);
    this.lureVY = Math.min(this.lureVY + FALL_ACC * dt, FALL_MAX);
    this.lure.y += this.lureVY * dt;
    this.bubbles(dt);

    if (this.lure.y >= this.lineLimitY) {
      this.lure.y = this.lineLimitY;
      this.say(reelDepth() < ZONE_DEPTH ? 'Леска кончилась!\nКупите длиннее в магазине' : 'Дно!', 1600);
      this.startAscent();
      return;
    }
    for (const f of this.fish) {
      if (f.st !== 'swim' || Math.abs(f.spr.y - this.lure.y) > 140) continue;
      if (!this.touches(f)) continue;
      if (this.toasterReady) {
        this.toasterReady = false;
        this.zap(f);
        continue;
      }
      this.hook(f);
      this.startAscent();
      return;
    }
  }

  private startAscent(): void {
    this.phase = 'ascent';
    this.lureVY = ASC_START;
    this.maxDepth = Math.max(this.maxDepth, (this.lure.y - WATER_Y) / PPM);
    haptic('medium');
    if (S.d.bestDepth < 40 && this.hooked.length <= 1) this.say('Теперь ловите!\nСобирайте рыбу на подъёме', 2200);
  }

  private updateAscent(dt: number, time: number): void {
    this.steer(dt, time);
    this.lureVY = Math.min(this.lureVY + ASC_ACC * dt, ASC_MAX);
    this.lure.y -= this.lureVY * dt;

    for (const f of this.fish) {
      if (f.st !== 'swim' || Math.abs(f.spr.y - this.lure.y) > 200) continue;
      if (this.touches(f, MAGNET)) {
        // магнит: подтягиваем рыбу к крючку
        f.spr.x += (this.lure.x - f.spr.x) * Math.min(1, dt * 4);
        f.spr.y += (this.lure.y + 22 - f.spr.y) * Math.min(1, dt * 4);
      }
      if (this.touches(f)) this.hook(f);
    }
    this.hooked.forEach((f) => {
      f.spr.x = this.lure.x + f.ox + Math.sin(time / 180 + f.ph) * 5;
      f.spr.y = this.lure.y + f.oy + f.def.w * 0.4;
      f.spr.rotation = -Math.PI / 2 + Math.sin(time / 220 + f.ph) * 0.18;
    });

    if (this.lure.y <= WATER_Y + 6) this.startLaunch();
  }

  private hook(f: FishObj): void {
    f.st = 'hooked';
    const i = this.hooked.length;
    f.ox = rnd(-16, 16);
    f.oy = 18 + Math.min(i, 10) * 3;
    f.spr.setFlipX(false).setDepth(15 + (i % 5));
    this.hooked.push(f);
    sfx.hook();
    haptic('light');
  }

  private zap(f: FishObj): void {
    f.st = 'dead';
    f.spr.setTint(0xfff27a);
    this.tweens.add({ targets: f.spr, alpha: 0, y: f.spr.y - 30, angle: 180, duration: 500, onComplete: () => f.spr.destroy() });
    this.burst(f.spr.x, f.spr.y, 0xfff27a, 10);
    this.say('Тостер!', 900);
    sfx.zap();
    haptic('heavy');
  }

  private startLaunch(): void {
    this.phase = 'launch';
    this.maxDepth = Math.max(this.maxDepth, 0);
    this.lure.y = WATER_Y;
    this.tweens.add({ targets: this.lure, x: ROD_TIP.x, y: ROD_TIP.y + 20, alpha: 0, duration: 400 });
    this.splash(this.lure.x, WATER_Y, 14);
    sfx.splash();
    this.depthText.setText(`${Math.floor(this.maxDepth)} м`);
    this.camLocked = true;
    this.tweens.add({ targets: this.cameras.main, scrollY: 0, duration: 550, ease: 'Sine.out' });

    if (this.hooked.length === 0) {
      this.time.delayedCall(700, () => this.showResults());
      return;
    }
    const springy = owns('spring');
    const gs = springy ? 0.55 : 1;
    for (const f of this.hooked) {
      f.st = 'air';
      f.hp = f.def.hp;
      f.spr.setPosition(this.lure.x + rnd(-24, 24), WATER_Y - 10).setDepth(30);
      f.vx = rnd(-170, 170);
      f.vy = -rnd(760, 1150) * Math.sqrt(gs);
      f.spin = rnd(-3.5, 3.5);
    }
    this.hooked = [];
    haptic('heavy');
    if (S.d.bestDepth < 40) this.say('Стреляйте пальцем!\nМусор не трогайте — штраф', 2400);
    this.cross.setVisible(true);
  }

  private updateLaunch(dt: number, time: number): void {
    const gs = owns('spring') ? 0.55 : 1;
    let alive = 0;
    for (const f of this.fish) {
      if (f.st !== 'air') continue;
      alive++;
      f.vy += GRAV * gs * dt;
      f.spr.x += f.vx * dt;
      f.spr.y += f.vy * dt;
      f.spr.rotation += f.spin * dt;
      const hw = f.def.w / 2;
      if (f.spr.x < hw || f.spr.x > W - hw) {
        f.vx = -f.vx;
        f.spr.x = clamp(f.spr.x, hw, W - hw);
      }
      if (f.vy > 0 && f.spr.y > WATER_Y + 8) {
        f.st = 'lost';
        this.splash(f.spr.x, WATER_Y, 6);
        sfx.splash();
        this.tweens.add({ targets: f.spr, alpha: 0, y: f.spr.y + 60, duration: 300, onComplete: () => f.spr.destroy() });
      }
    }

    // стрельба: каждый палец стреляет сам по себе
    const cam = this.cameras.main;
    const gun = currentGun();
    const pointers: PPointer[] = this.input.manager.pointers;
    for (const p of pointers) {
      if (!p.isDown) continue;
      const last = this.lastShot[p.id] ?? -1e9;
      if (time - last < gun.reload) continue;
      this.lastShot[p.id] = time;
      const wp = cam.getWorldPoint(p.x, p.y);
      this.fire(wp.x, wp.y);
    }
    const ap = this.input.activePointer;
    const wp = cam.getWorldPoint(ap.x, ap.y);
    this.cross.setPosition(wp.x, wp.y);

    if (alive === 0 && !this.ending) {
      this.ending = true;
      this.time.delayedCall(900, () => this.showResults());
    }
  }

  private fire(x: number, y: number): void {
    const gun = currentGun();
    if (gun.pellets > 1 || gun.dmg > 10) sfx.heavyShot();
    else sfx.shot();
    if (gun.reload >= 200) haptic('light');
    const targets = this.fish.filter((f) => f.st === 'air').reverse();
    for (let i = 0; i < gun.pellets; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * gun.spread;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      const fx = this.add.image(px, py, 'dot').setDepth(80).setTint(0xffe58a).setScale(0.6);
      this.tweens.add({ targets: fx, scale: 0, alpha: 0, duration: 160, onComplete: () => fx.destroy() });
      for (const f of targets) {
        if (f.st !== 'air') continue;
        if (this.pointIn(f, px, py)) {
          this.damage(f, gun.dmg);
          break;
        }
      }
    }
  }

  private pointIn(f: FishObj, px: number, py: number): boolean {
    const dx = px - f.spr.x;
    const dy = py - f.spr.y;
    const r = -f.spr.rotation;
    const lx = dx * Math.cos(r) - dy * Math.sin(r);
    const ly = dx * Math.sin(r) + dy * Math.cos(r);
    const a = f.def.w * 0.5 + 12;
    const b = f.def.h * 0.5 + 12;
    return (lx * lx) / (a * a) + (ly * ly) / (b * b) <= 1;
  }

  private damage(f: FishObj, dmg: number): void {
    f.hp -= dmg;
    f.vy -= 35;
    f.spr.setTintFill(0xffffff);
    this.time.delayedCall(45, () => f.spr.active && f.spr.clearTint());
    if (f.hp <= 0) this.kill(f);
  }

  private kill(f: FishObj): void {
    f.st = 'dead';
    const v = f.def.value > 0 ? Math.round(f.def.value * priceMult()) : f.def.value;
    this.runMoney += v;
    this.killed[f.def.id] = (this.killed[f.def.id] || 0) + 1;
    const t = txt(this, f.spr.x, f.spr.y, (v > 0 ? '+' : '−') + money(Math.abs(v)), v > 0 ? 34 : 38, v > 0 ? '#ffe58a' : '#ff6b5a', {
      fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(85);
    this.tweens.add({ targets: t, y: t.y - 90, alpha: 0, duration: 900, ease: 'Sine.out', onComplete: () => t.destroy() });
    this.burst(f.spr.x, f.spr.y, f.def.color, f.def.kind === 'boss' ? 30 : 10);
    this.tweens.add({ targets: f.spr, scale: 0, alpha: 0, duration: 220, onComplete: () => f.spr.destroy() });
    if (v > 0) {
      sfx.coin();
      haptic('medium');
    } else {
      sfx.bad();
      haptic('error');
      this.cameras.main.shake(160, 0.006);
    }
    if (f.def.kind === 'boss') this.cameras.main.shake(300, 0.012);
  }

  // ---------- итоги ----------
  private showResults(): void {
    if (this.phase === 'results') return;
    this.phase = 'results';
    this.cross.setVisible(false);
    this.cameras.main.scrollY = 0;

    const newOnes = Object.keys(this.killed).filter((id) => !(S.d.caught[id] > 0));
    S.d.money = Math.max(0, S.d.money + this.runMoney);
    for (const [id, n] of Object.entries(this.killed)) S.d.caught[id] = (S.d.caught[id] || 0) + n;
    const record = this.maxDepth > S.d.bestDepth;
    S.d.bestDepth = Math.max(S.d.bestDepth, this.maxDepth);
    save();

    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0).setDepth(150);
    shade.setInteractive(); // блокирует клики под панелью
    const pg = this.add.graphics().setDepth(151);
    const top = 170;
    const ids = Object.keys(this.killed);
    const panelH = Math.max(560, 330 + ids.length * 46);
    pg.fillStyle(0x0b2236, 0.94);
    pg.fillRoundedRect(40, top, W - 80, panelH, 26);
    pg.lineStyle(4, 0xf2b822, 1);
    pg.strokeRoundedRect(40, top, W - 80, panelH, 26);

    const d = 152;
    txt(this, W / 2, top + 30, 'Улов', 54, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(d);
    txt(this, W / 2, top + 96, `Глубина ${Math.floor(this.maxDepth)} м${record ? ' — рекорд!' : ''}`, 26, record ? '#7fd1a0' : '#9fd3ef').setOrigin(0.5, 0).setDepth(d);

    let y = top + 150;
    if (!ids.length) {
      txt(this, W / 2, y + 30, 'Пусто…\nНа спуске уворачивайтесь от рыб,\nна подъёме собирайте их,\nа в воздухе — стреляйте!', 28, '#c9dbe6', { align: 'center' })
        .setOrigin(0.5, 0).setDepth(d);
    }
    for (const id of ids) {
      const def = FISH_BY_ID[id];
      const n = this.killed[id];
      const v = (def.value > 0 ? Math.round(def.value * priceMult()) : def.value) * n;
      this.add.image(110, y + 18, 'fish_' + id).setScale(Math.min(60 / (def.w + 12), 36 / (def.h + 12), 1)).setDepth(d);
      const nt = txt(this, 160, y, `${def.name} ×${n}`, 28, '#ffffff').setDepth(d);
      if (newOnes.includes(id)) txt(this, nt.x + nt.width + 12, y + 5, 'НОВИНКА', 19, '#7fd1a0', { fontStyle: 'bold' }).setDepth(d);
      txt(this, W - 80, y, (v >= 0 ? '+' : '−') + money(Math.abs(v)), 28, v >= 0 ? '#ffe58a' : '#ff8a7a', { fontStyle: 'bold' }).setOrigin(1, 0).setDepth(d);
      y += 46;
    }
    const by = top + panelH - 170;
    txt(this, W / 2, by - 10, 'Итого: ' + (this.runMoney >= 0 ? '+' : '−') + money(Math.abs(this.runMoney)), 38, '#ffe58a', { fontStyle: 'bold' })
      .setOrigin(0.5, 1).setDepth(d);
    const b1 = button(this, W / 2 - 140, by + 70, 250, 90, 'На лодку', () => this.scene.start('Menu'), { color: 0x9fd3ef });
    const b2 = button(this, W / 2 + 140, by + 70, 250, 90, 'Ещё раз', () => this.scene.restart(), {});
    b1.c.setDepth(160);
    b2.c.setDepth(160);
    haptic('success');
  }

  // ---------- эффекты ----------
  private say(s: string, ms: number): void {
    this.tweens.killTweensOf(this.msgText);
    this.msgText.setText(s).setAlpha(1);
    this.tweens.add({ targets: this.msgText, alpha: 0, delay: ms, duration: 400 });
  }

  private splash(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, 'dot').setDepth(27).setTint(0xdff3ff).setScale(rnd(0.3, 0.7));
      this.tweens.add({ targets: p, x: x + rnd(-60, 60), y: y - rnd(30, 110), alpha: 0, duration: rnd(350, 650), ease: 'Quad.out', onComplete: () => p.destroy() });
    }
  }

  private burst(x: number, y: number, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rnd(30, 90);
      const p = this.add.image(x, y, 'dot').setDepth(84).setTint(color).setScale(rnd(0.4, 0.9));
      this.tweens.add({ targets: p, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, alpha: 0, scale: 0.1, duration: rnd(300, 600), onComplete: () => p.destroy() });
    }
  }

  private bubbles(dt: number): void {
    this.bubbleT -= dt;
    if (this.bubbleT > 0) return;
    this.bubbleT = 0.12;
    const b = this.add.image(this.lure.x + rnd(-10, 10), this.lure.y, 'bubble').setDepth(18).setScale(rnd(0.5, 1));
    this.tweens.add({ targets: b, y: b.y - rnd(80, 160), x: b.x + rnd(-20, 20), alpha: 0, duration: 900, onComplete: () => b.destroy() });
  }
}
