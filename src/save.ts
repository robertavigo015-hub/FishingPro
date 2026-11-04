import { SHOP_BY_ID, START_REEL, GunDef } from './data';
import { cloudGet, cloudSet } from './telegram';

export interface SaveData {
  v: 1;
  money: number;
  owned: string[];
  gun: string;
  caught: Record<string, number>;
  bestDepth: number;
  tiltOn: boolean;
  tiltInvert: boolean;
  sound: boolean;
  ts: number;
}

const KEY = 'fishing_save_v1';

export function defaultSave(): SaveData {
  return { v: 1, money: 0, owned: ['pistol'], gun: 'pistol', caught: {}, bestDepth: 0, tiltOn: true, tiltInvert: false, sound: true, ts: 0 };
}

export const S: { d: SaveData } = { d: defaultSave() };

function parse(s: string | null): SaveData | null {
  if (!s) return null;
  try {
    const o = JSON.parse(s);
    if (o && o.v === 1) return { ...defaultSave(), ...o };
  } catch {
    /* ignore */
  }
  return null;
}

export async function loadSave(): Promise<void> {
  let local: SaveData | null = null;
  try {
    local = parse(localStorage.getItem(KEY));
  } catch {
    /* ignore */
  }
  const cloud = parse(await cloudGet(KEY));
  const best = [local, cloud].filter(Boolean).sort((a, b) => b!.ts - a!.ts)[0];
  if (best) S.d = best;
}

let timer: number | undefined;
export function save(): void {
  S.d.ts = Date.now();
  const s = JSON.stringify(S.d);
  try {
    localStorage.setItem(KEY, s);
  } catch {
    /* ignore */
  }
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => cloudSet(KEY, s), 400);
}

export function owns(id: string): boolean {
  return S.d.owned.includes(id);
}

export function reelDepth(): number {
  let d = START_REEL;
  for (const id of S.d.owned) {
    const it = SHOP_BY_ID[id];
    if (it?.reelDepth && it.reelDepth > d) d = it.reelDepth;
  }
  return d;
}

export function currentGun(): GunDef {
  return (SHOP_BY_ID[S.d.gun]?.gun || SHOP_BY_ID['pistol'].gun)!;
}

export function priceMult(): number {
  return owns('telnyashka') ? 1.1 : 1;
}
