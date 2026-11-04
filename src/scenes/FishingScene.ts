import { W, H, PPM, WATER_Y, FISH, FISH_BY_ID, FishDef, ZoneDef, ZONES } from '../data';
import { S, save, owns, reelDepth, currentGun, priceMult, zone, best, zoneUnlocked } from '../save';
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
  wall?: boolean; // часть стенки из рыб
  by?: number; // базовая высота для покачивания
  bounced?: boolean; // уже отскочила ото льда
}

const FALL_MAX = 360;
const FALL_ACC = 900;
const LAT = 560;
const ASC_START = 170;
const ASC_ACC = 130;
const ASC_MAX = 950;
const MAGNET = 70;
const GRAV = 560;
// рука рыбака в мировых координатах (из текстуры лодки: кисть в точке 162,96)
const HAND = { x: W / 2 - 30 - 145 + 162, y: WATER_Y - 60 - 90 + 92 };
const GUN_SCALE = 1.8;
const RAY_LEN = 1600; // дальность луча выстрела, px
const RAY_PAD = 10; // запас вокруг рыбы для попадания лучом, px
interface GunArt { w: number; h: number; ox: number; oy: number; mx: number; my: number }
const GUNS: Record<string, GunArt> = {
  pistol: { w: 70, h: 30, ox: 16, oy: 18, mx: 66, my: 9 },
  shotgun: { w: 130, h: 26, ox: 34, oy: 14, mx: 128, my: 10 },
  uzi: { w: 84, h: 40, ox: 34, oy: 24, mx: 82, my: 13 },
  magnum: { w: 96, h: 32, ox: 20, oy: 18, mx: 92, my: 10 },
  minigun: { w: 116, h: 46, ox: 24, oy: 26, mx: 114, my: 18 },
};
const ROD_TIP = { x: W / 2 - 30 - 145 + 270, y: WATER_Y - 60 - 90 + 8 };
const HOLE_X = ROD_TIP.x; // прорубь на Байкале
const HOLE_HALF = 70;
const ICE_TOP = WATER_Y + 6;
const ENDLESS_CHUNK = 100; // м, сколько бездны генерируется за раз
const ZONE_HINT: Record<string, string> = {
  volga: 'Течение сносит блесну!\nНа разной глубине — в разные стороны',
  baikal: 'Подо льдом темно.\nУлов отскакивает ото льда — успейте сбить!\nНерпу не трогать: штраф',
  barents: 'Дна нет. Леска — ваш предел.\nКаждые 500 м — гигантский кальмар',
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerpColor = (c1: number, c2: number, k: number) => {
  const r = ((c1 >> 16) & 255) + ((((c2 >> 16) & 255) - ((c1 >> 16) & 255)) * k);
  const g = ((c1 >> 8) & 255) + ((((c2 >> 8) & 255) - ((c1 >> 8) & 255)) * k);
  const b = (c1 & 255) + (((c2 & 255) - (c1 & 255)) * k);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};

export class FishingScene extends Phaser.Scene {
  private z!: ZoneDef;
  private phase: Phase = 'intro';
  private fish: FishObj[] = [];
  private hooked: FishObj[] = [];
  private lure!: PImage;
  private lureVX = 0;
  private lureVY = 0;
  private lineG!: PGraphics;
  private barG!: PGraphics;
  private waterG!: PGraphics;
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
  private lineLimitM = 0;
  private bottomY = 0;
  private spawnedTo = 0;
  private curPhase = 0;
  private streaks: PImage[] = [];
  private lastBgScroll = -1;
  private gun: PImage = null;
  private gunInfo: GunArt = GUNS.pistol;
  private aim = -Math.PI / 2;
  private recoil = 0;
  private hitstop = 0;

  constructor() {
    super('Fishing');
  }

  create(): void {
    hideBack();
    this.z = zone();
    this.phase = 'intro';
    this.fish = [];
    this.hooked = [];
    this.streaks = [];
    this.lureVX = 0;
    this.lureVY = 0;
    this.toasterReady = owns('toaster');
    this.runMoney = 0;
    this.killed = {};
    this.lastShot = {};
    this.ending = false;
    this.maxDepth = 0;
    this.camLocked = false;
    this.gun = null;
    this.recoil = 0;
    this.hitstop = 0;
    this.lastBgScroll = -1;
    this.curPhase = Math.random() * Math.PI * 2;
    const endless = this.z.mechanic === 'endless';
    this.lineLimitM = endless ? reelDepth() : Math.min(reelDepth(), this.z.depth - 0.5);
    this.lineLimitY = WATER_Y + this.lineLimitM * PPM - 14;
    this.bottomY = WATER_Y + (endless ? Math.min(this.lineLimitM, 100000) + 30 : this.z.depth) * PPM;
    this.spawnedTo = 0;

    this.drawWorld();
    if (endless) this.spawnRange(0, ENDLESS_CHUNK * 2);
    else this.spawnRange(0, this.z.depth);

    this.lineG = this.add.graphics().setDepth(19);
    this.lure = this.add.image(ROD_TIP.x, ROD_TIP.y, 'lure').setDepth(20).setOrigin(0.5, 0.15);
    this.glow = this.add.image(0, 0, 'glow').setDepth(51).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(owns('projector') ? 3.4 : 2.2).setAlpha(0);
    this.dark = this.add.rectangle(0, 0, W, H, 0x02070f, 1).setOrigin(0).setScrollFactor(0).setDepth(50).setAlpha(0);
    this.cross = this.add.image(0, 0, 'cross').setDepth(90).setVisible(false);

    if (this.z.mechanic === 'current') {
      for (let i = 0; i < 28; i++) {
        this.streaks.push(this.add.image(rnd(0, W), WATER_Y + rnd(40, H), 'dot').setScale(rnd(3, 6), 0.16).setAlpha(0.35).setDepth(4));
      }
    }

    // HUD
    this.depthText = txt(this, 28, 22, '0 м', 52, '#ffffff', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 8 }).setScrollFactor(0).setDepth(100);
    const lineLabel = reelDepth() >= 99999 ? 'леска ∞' : `леска ${reelDepth()} м`;
    this.subText = txt(this, 30, 86, `${this.z.name} · ${lineLabel}`, 24, '#ffffff', { stroke: '#0b2236', strokeThickness: 5 }).setScrollFactor(0).setDepth(100);
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
        if (location.hash === '#debug-shoot') {
          // отладка стрельбы: сразу подбрасываем десяток случайных рыб
          for (const f of this.fish.filter((o) => o.def.kind !== 'boss' && !o.wall).sort(() => Math.random() - 0.5).slice(0, 10)) this.hook(f);
          this.lure.y = WATER_Y + 4;
          this.startLaunch();
          return;
        }
        if (this.z.id === 'pond' && best('pond') < 40) this.say('Уворачивайтесь от рыб!\nНаклон телефона, палец или ←/→', 3000);
        else if (ZONE_HINT[this.z.id] && best(this.z.id) < 60) this.say(ZONE_HINT[this.z.id], 3200);
      },
    });
  }

  // ---------- мир ----------
  private drawWorld(): void {
    const z = this.z;
    const g = this.add.graphics().setDepth(0);
    gradient(g, 0, 0, W, WATER_Y, z.sky[0], z.sky[1], 30);
    // вода рисуется в update() по глубине камеры — так работает и бездонное море
    this.waterG = this.add.graphics().setScrollFactor(0).setDepth(0);

    if (z.id === 'pond') {
      g.fillStyle(0xfff1b0, 1);
      g.fillCircle(580, 260, 64);
      g.fillStyle(0x5c8f3a, 1);
      g.fillEllipse(90, WATER_Y + 4, 380, 60);
      g.fillEllipse(650, WATER_Y + 4, 300, 46);
      this.add.image(660, WATER_Y - 70, 'reeds').setDepth(2);
    } else if (z.id === 'volga') {
      g.fillStyle(0xfff4d0, 1);
      g.fillCircle(150, 300, 54);
      g.fillStyle(0xc9a86a, 1); // высокий песчаный берег
      g.fillRect(0, WATER_Y - 120, W, 124);
      g.fillStyle(0x7a9a4a, 1);
      g.fillRect(0, WATER_Y - 130, W, 14);
      g.fillStyle(0x6b8a3e, 1);
      for (let i = 0; i < 14; i++) g.fillCircle(20 + i * 52, WATER_Y - 136, 26);
      // церковь на холме
      g.fillStyle(0xf2efe6, 1);
      g.fillRect(520, WATER_Y - 230, 60, 100);
      g.fillRect(538, WATER_Y - 290, 24, 60);
      g.fillStyle(0xd4a52a, 1);
      g.fillCircle(550, WATER_Y - 300, 16);
      g.fillCircle(550, WATER_Y - 232, 22);
      g.fillStyle(0x3f7fa8, 1);
      g.fillRect(0, WATER_Y - 6, W, 10);
    } else if (z.id === 'baikal') {
      g.fillStyle(0xdfe9f2, 1); // заснеженные горы
      g.fillTriangle(-40, WATER_Y, 160, WATER_Y - 330, 360, WATER_Y);
      g.fillTriangle(260, WATER_Y, 480, WATER_Y - 420, 700, WATER_Y);
      g.fillTriangle(520, WATER_Y, 700, WATER_Y - 260, 860, WATER_Y);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(120, WATER_Y - 260, 160, WATER_Y - 330, 200, WATER_Y - 260);
      g.fillTriangle(430, WATER_Y - 340, 480, WATER_Y - 420, 530, WATER_Y - 340);
      g.fillStyle(0xb8c9d8, 1);
      g.fillRect(0, WATER_Y - 30, W, 40);
    } else if (z.id === 'barents') {
      g.fillStyle(0x5d6a74, 1); // скалы
      g.fillTriangle(-20, WATER_Y, 90, WATER_Y - 180, 220, WATER_Y);
      g.fillTriangle(560, WATER_Y, 650, WATER_Y - 140, 760, WATER_Y);
      g.fillStyle(0xffffff, 0.5);
      for (let i = 0; i < 8; i++) g.fillEllipse(40 + i * 95, WATER_Y - 4 + (i % 2) * 6, 70, 10);
    }

    // дно (у бездны его нет)
    if (z.mechanic !== 'endless') {
      g.fillStyle(z.floor, 1);
      g.fillRect(0, this.bottomY + 30, W, 400);
      g.fillStyle(lerpColor(z.floor, 0xffffff, 0.12), 1);
      for (let i = 0; i < 12; i++) g.fillEllipse(i * 66 + 20, this.bottomY + 34, 90, 30);
      for (let i = 0; i < 8; i++) this.add.image(40 + i * 92, this.bottomY - 30, 'weed').setDepth(3).setScale(rnd(0.8, 1.3));
      this.depthMarks(0, z.depth);
    }

    this.add.image(120, 100, 'cloud').setDepth(1);
    this.add.image(470, 420, 'cloud').setScale(0.8).setDepth(1);

    if (z.mechanic === 'ice') {
      this.add.image(W / 2 - 30, WATER_Y - 60, 'icefisher').setDepth(25);
      const ice = this.add.graphics().setDepth(26);
      const iceRect = (x0: number, x1: number) => {
        ice.fillStyle(0xcfe3f0, 1);
        ice.fillRect(x0, ICE_TOP, x1 - x0, 34);
        ice.fillStyle(0xffffff, 1);
        ice.fillRect(x0, ICE_TOP, x1 - x0, 7);
        ice.fillStyle(0x9fc0d6, 1);
        ice.fillRect(x0, ICE_TOP + 30, x1 - x0, 4);
      };
      iceRect(0, HOLE_X - HOLE_HALF);
      iceRect(HOLE_X + HOLE_HALF, W);
      ice.fillStyle(0x1d4a66, 1);
      ice.fillRect(HOLE_X - HOLE_HALF, WATER_Y + 2, HOLE_HALF * 2, 6);
      ice.lineStyle(2, 0xffffff, 0.6);
      for (let i = 0; i < 6; i++) ice.lineBetween(30 + i * 100, ICE_TOP + 12, 70 + i * 100, ICE_TOP + 24);
    } else {
      const boat = this.add.image(W / 2 - 30, WATER_Y - 60, 'boat').setDepth(25);
      this.tweens.add({ targets: boat, y: WATER_Y - 55, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const wg = this.add.graphics().setDepth(26);
      wg.fillStyle(z.water[0], 0.55);
      wg.fillRect(0, WATER_Y, W, 14);
    }
  }

  private depthMarks(from: number, to: number): void {
    const step = this.z.mechanic === 'endless' ? 50 : 25;
    for (let d = Math.ceil(Math.max(step, from) / step) * step; d < to; d += step) {
      const y = WATER_Y + d * PPM;
      const g = this.add.graphics().setDepth(1);
      const major = d % (step * 2) === 0;
      g.fillStyle(0xffffff, major ? 0.18 : 0.08);
      g.fillRect(0, y, major ? 46 : 24, 3);
      if (major) txt(this, 52, y - 12, d + ' м', 20, '#ffffff').setAlpha(0.3).setDepth(1);
    }
  }

  /** Расставляет рыб зоны на глубинах [from, to). В бездне вызывается по мере спуска. */
  private spawnRange(from: number, to: number): void {
    const z = this.z;
    const endless = z.mechanic === 'endless';
    const defs = FISH.filter((f) => f.zone === z.id);
    for (const def of defs) {
      if (def.kind === 'boss') {
        if (!endless) {
          if (def.midD >= from && def.midD < to) this.place(def, def.midD, W / 2);
        } else {
          for (let d = Math.ceil(Math.max(from, 1) / 500) * 500; d < to; d += 500) this.place(def, d, W / 2);
        }
        continue;
      }
      if (def.kind === 'rare') {
        if (!endless) {
          if (from === 0 && Math.random() < (def.odds ?? 0)) this.place(def, rnd(def.minD, def.maxD));
        } else {
          for (let d = Math.max(from, def.minD); d < to; d += ENDLESS_CHUNK) {
            if (Math.random() < (def.odds ?? 0) / 4) this.place(def, rnd(d, d + ENDLESS_CHUNK));
          }
        }
        continue;
      }
      let acc = Math.random();
      const start = Math.max(from, def.minD);
      const end = Math.min(to, def.maxD);
      for (let d = start; d < end; d += 10) {
        const k = d < def.midD ? (d - def.minD) / Math.max(1, def.midD - def.minD) : (def.maxD - d) / Math.max(1, def.maxD - def.midD);
        const deep = endless ? Math.min(3, 1 + d / 600) : 1; // в бездне рыбы всё больше (до ×3)
        acc += (def.perHundred / 10) * (0.25 + 0.75 * clamp(k, 0, 1)) * deep;
        while (acc >= 1) {
          acc -= 1;
          const dd = d + Math.random() * 10;
          if (dd >= 7 && (endless || dd < z.depth - 4)) this.place(def, dd);
        }
      }
    }
    // стенки из рыб с проходом
    if (z.walls) {
      let d = Math.max(from, 60) + rnd(10, 60);
      const limit = endless ? to : Math.min(to, z.depth - 30);
      while (d < limit) {
        if (Math.random() < 0.55) this.wall(d, defs);
        d += rnd(70, 130) / (endless ? 1 + d / 2000 : 1);
      }
    }
    if (endless) this.depthMarks(from, to);
    this.spawnedTo = Math.max(this.spawnedTo, to);
  }

  private wall(depth: number, defs: FishDef[]): void {
    const cands = defs.filter((f) => f.kind === 'fish' && f.minD <= depth && f.maxD >= depth && !f.ghost).sort((a, b) => a.w - b.w);
    const def = cands[0];
    if (!def) return;
    const gap = 190;
    const gx = rnd(110, W - 110);
    const stepX = def.w + 8;
    const vx = Math.random() < 0.35 ? rnd(30, 70) * (Math.random() < 0.5 ? -1 : 1) : 0;
    for (let x = def.w / 2 + 4; x < W; x += stepX) {
      if (Math.abs(x - gx) < gap / 2) continue;
      const o = this.place(def, depth, x);
      o.wall = true;
      o.vx = vx;
      o.by = o.spr.y;
      o.spr.setFlipX(vx < 0);
    }
  }

  private place(def: FishDef, depth: number, x?: number): FishObj {
    const px = x ?? rnd(def.w / 2 + 10, W - def.w / 2 - 10);
    const spr = this.add.image(px, WATER_Y + depth * PPM, 'fish_' + def.id).setDepth(def.kind === 'boss' ? 9 : 10);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const sp = this.z.mechanic === 'endless' ? 1 + depth / 1500 : 1;
    const vx = def.speed * rnd(0.6, 1) * dir * sp;
    spr.setFlipX(vx < 0);
    if (def.ghost) spr.setAlpha(0.12);
    const o: FishObj = { def, spr, vx, vy: 0, hp: def.hp, st: 'swim', ox: 0, oy: 0, spin: 0, ph: Math.random() * 6 };
    this.fish.push(o);
    return o;
  }

  /** Скорость течения на глубине, px/с (вправо — плюс). */
  private currentAt(depthM: number): number {
    if (this.z.mechanic !== 'current' || depthM <= 0) return 0;
    return 230 * Math.sin(depthM / 38 + this.curPhase) * Math.min(1, depthM / 40);
  }

  // ---------- цикл ----------
  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;
    const z = this.z;

    this.updateSwimmers(dt, cam.scrollY, time);

    if (this.phase === 'descent') this.updateDescent(dt, time);
    else if (this.phase === 'ascent') this.updateAscent(dt, time);
    else if (this.phase === 'launch') this.updateLaunch(dt, time);

    // бездна догенерируется по мере спуска
    if (z.mechanic === 'endless' && this.phase === 'descent') {
      const d = (this.lure.y - WATER_Y) / PPM;
      if (d + ENDLESS_CHUNK * 1.2 > this.spawnedTo && this.spawnedTo < this.lineLimitM + 20) {
        this.spawnRange(this.spawnedTo, this.spawnedTo + ENDLESS_CHUNK);
      }
    }

    // камера
    if (!this.camLocked) {
      let target = cam.scrollY;
      if (this.phase === 'descent') target = this.lure.y - 400;
      if (this.phase === 'ascent') target = this.lure.y - 880;
      target = clamp(target, 0, this.bottomY + 300 - H);
      cam.scrollY += (target - cam.scrollY) * Math.min(1, dt * 7);
    }

    this.drawWater(cam.scrollY);
    this.updateStreaks(dt, cam.scrollY);

    // леска
    this.lineG.clear();
    if (this.phase === 'intro' || this.phase === 'descent' || this.phase === 'ascent') {
      this.lineG.lineStyle(2, 0xffffff, 0.75);
      this.lineG.lineBetween(ROD_TIP.x, ROD_TIP.y, this.lure.x, this.lure.y);
    }

    // темнота и свет
    const camDepth = (cam.scrollY + H / 2 - WATER_Y) / PPM;
    const lampK = owns('projector') ? 0.25 : owns('lamp') ? 0.5 : 1;
    const k = clamp(camDepth / z.visualDepth, 0, 1);
    const darkA = (z.darkBase + (z.dark - z.darkBase) * k) * lampK * clamp(camDepth / 15, 0, 1);
    this.dark.setAlpha(darkA);
    this.glow.setPosition(this.lure.x, this.lure.y + 10).setAlpha(this.lure.y > WATER_Y ? darkA * 1.1 : 0);

    this.updateHud();
  }

  private drawWater(scrollY: number): void {
    if (Math.abs(scrollY - this.lastBgScroll) < 3) return;
    this.lastBgScroll = scrollY;
    const z = this.z;
    const g = this.waterG;
    g.clear();
    const top = Math.max(0, WATER_Y - scrollY);
    if (top >= H) return;
    const bands = 24;
    const bh = (H - top) / bands;
    for (let i = 0; i < bands; i++) {
      const y = top + i * bh;
      const depthM = (scrollY + y + bh / 2 - WATER_Y) / PPM;
      g.fillStyle(lerpColor(z.water[0], z.water[1], clamp(depthM / z.visualDepth, 0, 1)), 1);
      g.fillRect(0, y, W, bh + 1);
    }
  }

  private updateStreaks(dt: number, scrollY: number): void {
    for (const st of this.streaks) {
      const d = (st.y - WATER_Y) / PPM;
      st.x += this.currentAt(d) * 1.8 * dt;
      const off = st.y < scrollY - 20 || st.y > scrollY + H + 20 || st.y < WATER_Y + 10;
      if (st.x < -80 || st.x > W + 80 || off) {
        st.y = Math.max(WATER_Y + 20, scrollY + rnd(0, H));
        const c = this.currentAt((st.y - WATER_Y) / PPM);
        st.x = off ? rnd(0, W) : c > 0 ? -60 : W + 60;
      }
    }
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
      const rec = best(this.z.id);
      const scale = this.z.mechanic === 'endless' ? Math.max(1000, rec * 1.25, depth * 1.1) : this.z.depth;
      g.fillStyle(0x0b2236, 0.5);
      g.fillRoundedRect(x - 8, y0 - 8, 16, h + 16, 8);
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(x - 3, y0, 6, h * clamp(this.lineLimitM / scale, 0, 1));
      g.fillStyle(0xf2b822, 1);
      g.fillCircle(x, y0 + h * clamp(depth / scale, 0, 1), 9);
      if (rec > 0) {
        g.fillStyle(0xd9533b, 1);
        g.fillRect(x - 12, y0 + h * clamp(rec / scale, 0, 1) - 2, 24, 4);
      }
    }
  }

  private updateSwimmers(dt: number, scrollY: number, time: number): void {
    const lx = this.lure.x, ly = this.lure.y;
    const lightR = owns('projector') ? 330 : 210;
    for (const f of this.fish) {
      if (f.st !== 'swim') continue;
      // далёкие от экрана рыбы не рисуются и не двигаются (в бездне их тысячи)
      const near = Math.abs(f.spr.y - scrollY - H / 2) < H * 1.4;
      if (f.spr.visible !== near) f.spr.setVisible(near);
      if (!near) continue;
      const hw = f.def.w / 2 + 4;
      if (f.wall) {
        f.spr.y = (f.by ?? f.spr.y) + Math.sin(time / 500 + f.spr.x / 60) * 4;
        if (f.vx) {
          f.spr.x += f.vx * dt;
          if (f.spr.x < -hw) f.spr.x += W + hw * 2;
          if (f.spr.x > W + hw) f.spr.x -= W + hw * 2;
        }
        continue;
      }
      f.spr.x += (f.vx + this.currentAt((f.spr.y - WATER_Y) / PPM) * 0.3) * dt;
      if (f.spr.x < hw) {
        f.vx = Math.abs(f.vx);
        f.spr.setFlipX(false);
      } else if (f.spr.x > W - hw) {
        f.vx = -Math.abs(f.vx);
        f.spr.setFlipX(true);
      }
      if (f.def.kind === 'junk') f.spr.rotation = Math.sin(time / 900 + f.ph) * 0.4;
      if (f.def.ghost) {
        const d = Math.hypot(f.spr.x - lx, f.spr.y - ly);
        f.spr.setAlpha(d < lightR ? 1 - (d / lightR) * 0.7 : 0.1);
      }
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
    const drift = this.currentAt((this.lure.y - WATER_Y) / PPM);
    this.lure.x = clamp(this.lure.x + (this.lureVX + drift) * dt + Math.sin(time / 280) * 0.5, 18, W - 18);
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
      this.say(reelDepth() < this.z.depth ? 'Леска кончилась!\nКупите длиннее в магазине' : 'Дно!', 1600);
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
    if (this.z.id === 'pond' && best('pond') < 40 && this.hooked.length <= 1) this.say('Теперь ловите!\nСобирайте рыбу на подъёме', 2200);
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

    if (this.z.mechanic === 'ice') {
      const d = (this.lure.y - WATER_Y) / PPM;
      if (d < 14) this.lure.x += (HOLE_X - this.lure.x) * Math.min(1, dt * (16 - d));
    }
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
      f.vx = rnd(-260, 260);
      f.vy = -rnd(720, 1100) * Math.sqrt(gs);
      f.spin = rnd(-3.5, 3.5);
    }
    this.hooked = [];
    haptic('heavy');
    if (this.z.id === 'pond' && best('pond') < 40) this.say('Стреляйте пальцем!\nМусор не трогайте — штраф', 2400);
    this.cross.setVisible(true);
    this.showGun();
  }

  // ---------- оружие ----------
  private showGun(): void {
    const id = S.d.gun in GUNS ? S.d.gun : 'pistol';
    this.gunInfo = GUNS[id];
    this.gun = this.add.image(HAND.x, HAND.y, 'gun_' + id)
      .setOrigin(this.gunInfo.ox / this.gunInfo.w, this.gunInfo.oy / this.gunInfo.h)
      .setDepth(28).setScale(0);
    this.aim = -Math.PI / 2 + 0.25;
    this.gun.rotation = this.aim;
    this.tweens.add({ targets: this.gun, scale: GUN_SCALE, duration: 250, ease: 'Back.out' });
  }

  private aimAt(x: number, y: number): void {
    let a = Math.atan2(y - HAND.y, x - HAND.x);
    if (a > -0.12) a = a > Math.PI / 2 ? -Math.PI + 0.12 : -0.12; // только вверх
    this.aim = a;
  }

  private updateGun(dt: number): void {
    if (!this.gun) return;
    this.recoil *= Math.exp(-dt * 16);
    const a = this.aim;
    const left = a < -Math.PI / 2;
    this.gun.rotation = a;
    this.gun.setFlipY(left);
    this.gun.setPosition(HAND.x - Math.cos(a) * this.recoil, HAND.y - Math.sin(a) * this.recoil);
  }

  private muzzle(): { x: number; y: number } {
    const gi = this.gunInfo;
    const a = this.aim;
    const lx = (gi.mx - gi.ox) * GUN_SCALE;
    const ly = (gi.my - gi.oy) * GUN_SCALE * (a < -Math.PI / 2 ? -1 : 1);
    return {
      x: this.gun.x + lx * Math.cos(a) - ly * Math.sin(a),
      y: this.gun.y + lx * Math.sin(a) + ly * Math.cos(a),
    };
  }

  private updateLaunch(dt: number, time: number): void {
    const gs = owns('spring') ? 0.55 : 1;
    let alive = 0;
    const frozen = this.hitstop > 0;
    if (frozen) this.hitstop -= dt;
    for (const f of this.fish) {
      if (f.st !== 'air') continue;
      alive++;
      if (frozen) continue;
      f.vy += GRAV * gs * dt;
      f.spr.x += f.vx * dt;
      f.spr.y += f.vy * dt;
      f.spr.rotation += f.spin * dt;
      f.vx *= Math.exp(-dt * 0.6);
      const hw = f.def.w / 2;
      if (f.spr.x < hw || f.spr.x > W - hw) {
        f.vx = -f.vx;
        f.spr.x = clamp(f.spr.x, hw, W - hw);
      }
      const onIce = this.z.mechanic === 'ice' && Math.abs(f.spr.x - HOLE_X) > HOLE_HALF;
      if (onIce && f.vy > 0 && f.spr.y > ICE_TOP - f.def.h * 0.3) {
        if (!f.bounced) {
          // первый удар о лёд: отскок — ещё один шанс сбить
          f.bounced = true;
          f.spr.y = ICE_TOP - f.def.h * 0.3;
          f.vy = -Math.abs(f.vy) * 0.5;
          f.vx *= 0.8;
          f.spin *= -0.6;
          sfx.hit();
          this.splash(f.spr.x, ICE_TOP, 5);
        } else {
          f.st = 'lost';
          const away = f.spr.x < HOLE_X ? -1 : 1;
          this.tweens.add({ targets: f.spr, x: f.spr.x + away * 500, y: ICE_TOP - f.def.h * 0.3, alpha: 0, duration: 700, ease: 'Quad.out', onComplete: () => f.spr.destroy() });
        }
        continue;
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
    const ap = this.input.activePointer;
    const awp = cam.getWorldPoint(ap.x, ap.y);
    this.cross.setPosition(awp.x, awp.y);
    this.aimAt(awp.x, awp.y);
    const pointers: PPointer[] = this.input.manager.pointers;
    for (const p of pointers) {
      if (!p.isDown) continue;
      const last = this.lastShot[p.id] ?? -1e9;
      if (time - last < gun.reload) continue;
      this.lastShot[p.id] = time;
      const wp = cam.getWorldPoint(p.x, p.y);
      this.aimAt(wp.x, wp.y);
      this.updateGun(0);
      this.fire(wp.x, wp.y);
    }
    this.updateGun(dt);

    if (alive === 0 && !this.ending) {
      this.ending = true;
      this.time.delayedCall(900, () => {
        if (this.gun) this.tweens.add({ targets: this.gun, scale: 0, duration: 200 });
        this.showResults();
      });
    }
  }

  private fire(x: number, y: number): void {
    const gun = currentGun();
    const heavy = gun.pellets > 1 || gun.dmg > 10;
    if (heavy) sfx.heavyShot();
    else sfx.shot();
    if (gun.reload >= 200) haptic(heavy ? 'medium' : 'light');
    const m = this.muzzle();
    const a = this.aim;

    // вспышка, отдача, тряска
    const fl = this.add.image(m.x, m.y, 'flash').setOrigin(0, 0.5).setRotation(a).setDepth(29)
      .setScale(rnd(1.1, 1.5) * (heavy ? 1.6 : 1));
    this.tweens.add({ targets: fl, alpha: 0, scaleX: fl.scaleX * 1.3, duration: heavy ? 130 : 90, onComplete: () => fl.destroy() });
    const glow = this.add.image(m.x, m.y, 'glow').setDepth(27).setBlendMode(Phaser.BlendModes.ADD).setScale(heavy ? 0.6 : 0.35).setAlpha(0.7);
    this.tweens.add({ targets: glow, alpha: 0, duration: 120, onComplete: () => glow.destroy() });
    this.recoil = heavy ? 26 : 13;
    this.cameras.main.shake(heavy ? 110 : 50, heavy ? 0.007 : 0.0022);
    this.tweens.killTweensOf(this.cross);
    this.cross.setScale(1.35);
    this.tweens.add({ targets: this.cross, scale: 1, duration: 120 });
    this.ejectShell(a);

    // Каждая дробина — луч от ствола через точку касания и дальше.
    // Засчитывается первая рыба на пути луча; трассер обрывается на ней.
    const targets = this.fish.filter((f) => f.st === 'air');
    const tracer = this.add.graphics().setDepth(29);
    for (let i = 0; i < gun.pellets; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * gun.spread;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      const len = Math.hypot(px - m.x, py - m.y) || 1;
      const dx = (px - m.x) / len;
      const dy = (py - m.y) / len;
      let best: FishObj | null = null;
      let bestT = RAY_LEN;
      for (const f of targets) {
        if (f.st !== 'air') continue;
        const t = this.rayHit(f, m.x, m.y, dx, dy);
        if (t !== null && t < bestT) {
          bestT = t;
          best = f;
        }
      }
      const ex = m.x + dx * bestT;
      const ey = m.y + dy * bestT;
      tracer.lineStyle(heavy ? 12 : 9, 0xffa020, 0.35);
      tracer.lineBetween(m.x, m.y, ex, ey);
      tracer.lineStyle(heavy ? 4 : 3, 0xfffbe0, 1);
      tracer.lineBetween(m.x, m.y, ex, ey);
      if (best) {
        this.damage(best, gun.dmg, ex, ey, Math.atan2(dy, dx));
      } else if (gun.pellets === 1) {
        const puff = this.add.image(px, py, 'dot').setDepth(80).setTint(0xdfe8ee).setScale(0.5).setAlpha(0.8);
        this.tweens.add({ targets: puff, scale: 1.4, alpha: 0, duration: 220, onComplete: () => puff.destroy() });
      }
    }
    this.tweens.add({ targets: tracer, alpha: 0, duration: 130, ease: 'Quad.in', onComplete: () => tracer.destroy() });
  }

  private ejectShell(a: number): void {
    const left = a < -Math.PI / 2;
    const s = this.add.image(HAND.x, HAND.y - 6, 'shell').setDepth(27);
    const side = left ? 1 : -1;
    const tx = HAND.x + side * rnd(40, 90);
    this.tweens.add({ targets: s, x: tx, y: HAND.y - rnd(50, 90), angle: rnd(200, 500) * side, duration: 160, ease: 'Quad.out',
      onComplete: () => this.tweens.add({ targets: s, y: WATER_Y + 4, x: tx + side * 20, angle: s.angle + 300 * side, duration: 260, ease: 'Quad.in',
        onComplete: () => { s.destroy(); sfx.casing(); } }) });
  }

  /** Расстояние от ствола до входа луча в рыбу (эллипс с запасом) или null. */
  private rayHit(f: FishObj, ox: number, oy: number, dx: number, dy: number): number | null {
    const rot = -f.spr.rotation;
    const c = Math.cos(rot), s = Math.sin(rot);
    const rx = ox - f.spr.x, ry = oy - f.spr.y;
    const lox = rx * c - ry * s, loy = rx * s + ry * c;
    const ldx = dx * c - dy * s, ldy = dx * s + dy * c;
    const a = f.def.w * 0.5 + RAY_PAD;
    const b = f.def.h * 0.5 + RAY_PAD;
    const A = (ldx * ldx) / (a * a) + (ldy * ldy) / (b * b);
    const B = 2 * ((lox * ldx) / (a * a) + (loy * ldy) / (b * b));
    const C = (lox * lox) / (a * a) + (loy * loy) / (b * b) - 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-B - sq) / (2 * A);
    const t2 = (-B + sq) / (2 * A);
    if (t2 < 0) return null;
    return Math.max(0, t1);
  }

  private damage(f: FishObj, dmg: number, px: number, py: number, dir: number): void {
    f.hp -= dmg;
    // отбрасывание по направлению выстрела и закрутка
    const push = f.def.kind === 'boss' ? 12 : 70;
    f.vx += Math.cos(dir) * push;
    f.vy += Math.sin(dir) * push - 30;
    f.spin += rnd(-4, 4);
    f.spr.setTintFill(0xffffff);
    this.time.delayedCall(50, () => f.spr.active && f.spr.clearTint());
    sfx.hit();
    // искры
    for (let i = 0; i < 5; i++) {
      const sp = this.add.image(px, py, 'dot').setDepth(82).setTint(i % 2 ? 0xffffff : 0xffd35a).setScale(rnd(0.25, 0.45));
      const aa = dir + Math.PI + rnd(-1, 1);
      const rr = rnd(20, 55);
      this.tweens.add({ targets: sp, x: px + Math.cos(aa) * rr, y: py + Math.sin(aa) * rr, alpha: 0, duration: rnd(150, 260), onComplete: () => sp.destroy() });
    }
    if (f.hp > 0) {
      const t = txt(this, px, py - 10, '−' + dmg, 22, '#ffffff', { fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 4 }).setOrigin(0.5).setDepth(83);
      this.tweens.add({ targets: t, y: t.y - 36, alpha: 0, duration: 420, onComplete: () => t.destroy() });
      // «пружинка» спрайта при попадании
      this.tweens.add({ targets: f.spr, scaleX: 1.15, scaleY: 0.88, duration: 50, yoyo: true });
    } else {
      this.kill(f);
    }
  }

  private kill(f: FishObj): void {
    f.st = 'dead';
    const v = f.def.value > 0 ? Math.round(f.def.value * priceMult()) : f.def.value;
    this.runMoney += v;
    this.killed[f.def.id] = (this.killed[f.def.id] || 0) + 1;
    this.hitstop = f.def.kind === 'boss' ? 0.18 : 0.045;
    const prot = f.def.kind === 'protected';
    const label = (prot ? 'Штраф ' : '') + (v > 0 ? '+' : '−') + money(Math.abs(v));
    if (prot) this.say(`${f.def.name} — охраняемое животное!`, 1400);
    const t = txt(this, f.spr.x, f.spr.y, label, v > 0 ? 34 : 38, v > 0 ? '#ffe58a' : '#ff6b5a', {
      fontStyle: 'bold', stroke: '#0b2236', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(85).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: t.y - 90, alpha: 0, delay: 250, duration: 750, ease: 'Sine.out', onComplete: () => t.destroy() });
    this.burst(f.spr.x, f.spr.y, f.def.color, f.def.kind === 'boss' ? 36 : 14);
    this.burst(f.spr.x, f.spr.y, 0xffffff, 6);
    // рыба «лопается»: короткое раздувание и исчезновение
    f.spr.setTintFill(0xffffff);
    this.tweens.add({ targets: f.spr, scale: 1.35, duration: 70, onComplete: () =>
      this.tweens.add({ targets: f.spr, scale: 0, alpha: 0, duration: 160, onComplete: () => f.spr.destroy() }) });
    if (v > 0) {
      haptic('medium');
      this.flyCoins(f.spr.x, f.spr.y, Math.min(6, 1 + Math.floor(v / 15)));
    } else {
      sfx.bad();
      haptic('error');
      this.cameras.main.shake(180, 0.008);
      this.cameras.main.flash(120, 160, 30, 20);
    }
    if (f.def.kind === 'boss') this.cameras.main.shake(350, 0.014);
  }

  private flyCoins(x: number, y: number, n: number): void {
    const target = { x: W - 60, y: 52 };
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x, y, 'coin').setDepth(95).setScale(0.9);
      const mx = x + rnd(-70, 70);
      const my = y + rnd(-80, -20);
      this.tweens.add({ targets: c, x: mx, y: my, duration: 160, ease: 'Quad.out', delay: i * 35,
        onComplete: () => this.tweens.add({ targets: c, x: target.x, y: target.y, scale: 0.5, duration: 380, ease: 'Quad.in',
          onComplete: () => {
            c.destroy();
            if (i === 0) sfx.coin();
            this.tweens.killTweensOf(this.rightText);
            this.rightText.setScale(1.25);
            this.tweens.add({ targets: this.rightText, scale: 1, duration: 140 });
          } }) });
    }
  }

  // ---------- итоги ----------
  private showResults(): void {
    if (this.phase === 'results') return;
    this.phase = 'results';
    this.cross.setVisible(false);
    this.cameras.main.scrollY = 0;
    this.msgText.setDepth(170).setY(H - 110);

    const newOnes = Object.keys(this.killed).filter((id) => !(S.d.caught[id] > 0));
    const lockedBefore = ZONES.filter((zz) => !zoneUnlocked(zz));
    S.d.money = Math.max(0, S.d.money + this.runMoney);
    for (const [id, n] of Object.entries(this.killed)) S.d.caught[id] = (S.d.caught[id] || 0) + n;
    const record = this.maxDepth > best(this.z.id);
    S.d.best[this.z.id] = Math.max(best(this.z.id), this.maxDepth);
    if (this.z.id === 'pond') S.d.bestDepth = S.d.best.pond;
    const opened = lockedBefore.filter((zz) => zoneUnlocked(zz));
    save();
    if (opened.length) this.time.delayedCall(500, () => this.say(`Открыта зона:\n${opened.map((zz) => zz.name).join(', ')}!`, 3000));

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
      const nt = txt(this, 160, y, `${def.kind === 'protected' ? 'Штраф: ' : ''}${def.name} ×${n}`, 28, def.kind === 'protected' ? '#ff8a7a' : '#ffffff').setDepth(d);
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
