// Игровые данные зоны «Родной пруд». Все рыбы, тексты и предметы — свои.

export const W = 720;
export const H = 1280;
export const PPM = 26; // пикселей на метр глубины
export const WATER_Y = 1180; // мировая координата поверхности воды
export const ZONE_DEPTH = 300; // глубина дна, м

export type Shape = 'normal' | 'tall' | 'long' | 'ruff' | 'striped' | 'cat' | 'gold' | 'boot' | 'can' | 'tire';
export type Kind = 'fish' | 'junk' | 'boss' | 'rare';

export interface FishDef {
  id: string;
  name: string;
  desc: string;
  hint: string;
  value: number; // отрицательное — штраф за выстрел
  hp: number;
  w: number;
  h: number;
  color: number;
  belly: number;
  fin: number;
  speed: number; // px/с
  minD: number;
  midD: number;
  maxD: number;
  perHundred: number; // плотность на 100 м в пике
  kind: Kind;
  shape: Shape;
  odds?: number; // для редких: шанс появиться за заброс
}

export const FISH: FishDef[] = [
  { id: 'peskar', name: 'Пескарь', desc: 'Мудрый, но осторожный. Чаще второе.', hint: 'Водится у самой поверхности.',
    value: 3, hp: 1, w: 46, h: 18, color: 0x9aa89e, belly: 0xdfe6dc, fin: 0x7d8a80, speed: 45,
    minD: 0, midD: 25, maxD: 90, perHundred: 14, kind: 'fish', shape: 'normal' },
  { id: 'ukleyka', name: 'Уклейка', desc: 'Блестит как новая копейка и так же мало стоит.', hint: 'Мелководье, ближе к 50 м.',
    value: 5, hp: 1, w: 52, h: 16, color: 0xb9c9d8, belly: 0xf2f6fa, fin: 0x9fb1c2, speed: 80,
    minD: 10, midD: 55, maxD: 130, perHundred: 12, kind: 'fish', shape: 'normal' },
  { id: 'karas', name: 'Карась', desc: 'Круглый, золотистый и уверенный, что щук не бывает.', hint: 'Глубина 50–150 м.',
    value: 8, hp: 2, w: 52, h: 38, color: 0xc9a23a, belly: 0xf0d98a, fin: 0xa3802a, speed: 35,
    minD: 30, midD: 90, maxD: 160, perHundred: 11, kind: 'fish', shape: 'tall' },
  { id: 'plotva', name: 'Плотва', desc: 'Красноглазая и красноперая. Не выспалась.', hint: 'Глубина 60–200 м.',
    value: 12, hp: 2, w: 56, h: 26, color: 0x9fb0c4, belly: 0xe8eef4, fin: 0xd9533b, speed: 55,
    minD: 60, midD: 120, maxD: 200, perHundred: 9, kind: 'fish', shape: 'normal' },
  { id: 'yorsh', name: 'Ёрш', desc: 'Колючий характер, колючий плавник, колючий взгляд.', hint: 'Держится глубже 80 м.',
    value: 15, hp: 3, w: 46, h: 24, color: 0x7e7a4e, belly: 0xc9c49a, fin: 0x55522f, speed: 40,
    minD: 80, midD: 150, maxD: 220, perHundred: 8, kind: 'fish', shape: 'ruff' },
  { id: 'okun', name: 'Окунь', desc: 'Полосатый хулиган. Носит тельняшку с рождения.', hint: 'Глубина 100–250 м.',
    value: 22, hp: 3, w: 58, h: 32, color: 0x8faa3e, belly: 0xe2e7b0, fin: 0xe0632f, speed: 60,
    minD: 100, midD: 180, maxD: 250, perHundred: 8, kind: 'fish', shape: 'striped' },
  { id: 'leshch', name: 'Лещ', desc: 'Плоский, как анекдот деда. И такой же тяжёлый.', hint: 'Глубже 150 м.',
    value: 40, hp: 6, w: 74, h: 54, color: 0x8c7f5c, belly: 0xd8ccaa, fin: 0x5f5640, speed: 30,
    minD: 150, midD: 230, maxD: 290, perHundred: 5, kind: 'fish', shape: 'tall' },
  { id: 'sudak', name: 'Судак', desc: 'Клыкастый и обидчивый. Подаётся в заливном.', hint: 'Глубина 190–300 м.',
    value: 70, hp: 8, w: 86, h: 28, color: 0x8495a4, belly: 0xdde3e8, fin: 0x5d6b78, speed: 70,
    minD: 190, midD: 260, maxD: 300, perHundred: 4, kind: 'fish', shape: 'long' },
  { id: 'shchuka', name: 'Щука', desc: 'Исполняет желания, но только свои.', hint: 'Самое дно пруда, быстро плавает.',
    value: 120, hp: 12, w: 118, h: 28, color: 0x5d7d3a, belly: 0xd5dfa8, fin: 0x45602a, speed: 100,
    minD: 220, midD: 285, maxD: 300, perHundred: 3, kind: 'fish', shape: 'long' },
  { id: 'zolotaya', name: 'Золотая рыбка', desc: 'Три желания не исполняет. Зато стоит как три улова.', hint: 'Редкая. Иногда мелькает глубже 240 м.',
    value: 500, hp: 3, w: 48, h: 32, color: 0xf2b822, belly: 0xffe58a, fin: 0xe07a12, speed: 140,
    minD: 240, midD: 270, maxD: 298, perHundred: 0, kind: 'rare', shape: 'gold', odds: 0.4 },
  { id: 'som', name: 'Сом Потапыч', desc: 'Хозяин пруда. Помнит ещё прадеда.', hint: 'Лежит на самом дне. Нужна леска 300 м.',
    value: 800, hp: 140, w: 250, h: 84, color: 0x4b4a3e, belly: 0x9a967c, fin: 0x34332b, speed: 25,
    minD: 296, midD: 296, maxD: 296, perHundred: 0, kind: 'boss', shape: 'cat' },
  // Мусор: ловится как рыба, но выстрел по нему стоит денег.
  { id: 'sapog', name: 'Старый сапог', desc: 'Левый. Правый ищут до сих пор.', hint: 'Не стреляйте в него!',
    value: -5, hp: 2, w: 40, h: 54, color: 0x5a3b26, belly: 0x3e2819, fin: 0x2a1b10, speed: 12,
    minD: 5, midD: 100, maxD: 300, perHundred: 3, kind: 'junk', shape: 'boot' },
  { id: 'banka', name: 'Консервная банка', desc: 'Килька в томате. Была.', hint: 'Не стреляйте в неё!',
    value: -10, hp: 2, w: 32, h: 42, color: 0xa7adb3, belly: 0xc23a2b, fin: 0x6e7479, speed: 14,
    minD: 50, midD: 180, maxD: 300, perHundred: 3, kind: 'junk', shape: 'can' },
  { id: 'shina', name: 'Шина', desc: 'От «Москвича». Протектор ещё ничего.', hint: 'Не стреляйте в неё!',
    value: -25, hp: 6, w: 64, h: 64, color: 0x26262a, belly: 0x55555c, fin: 0x111114, speed: 10,
    minD: 150, midD: 260, maxD: 300, perHundred: 2, kind: 'junk', shape: 'tire' },
];

export const FISH_BY_ID: Record<string, FishDef> = Object.fromEntries(FISH.map((f) => [f.id, f]));

export interface GunDef {
  dmg: number;
  pellets: number;
  spread: number; // радиус разброса, px
  reload: number; // мс между выстрелами
}

export type ShopCat = 'reel' | 'gun' | 'tech' | 'wear';

export interface ShopItem {
  id: string;
  cat: ShopCat;
  name: string;
  desc: string;
  cost: number;
  requires?: string;
  reelDepth?: number;
  gun?: GunDef;
}

export const START_REEL = 50;

export const SHOP: ShopItem[] = [
  { id: 'reel100', cat: 'reel', name: 'Леска 100 м', desc: 'Чтобы добраться до карасей.', cost: 60, reelDepth: 100 },
  { id: 'reel200', cat: 'reel', name: 'Леска 200 м', desc: 'Окуни, ерши и плотва.', cost: 250, reelDepth: 200, requires: 'reel100' },
  { id: 'reel300', cat: 'reel', name: 'Леска 300 м', desc: 'До самого дна пруда.', cost: 900, reelDepth: 300, requires: 'reel200' },

  { id: 'pistol', cat: 'gun', name: 'Пистолет', desc: 'Старый друг. Урон 3.', cost: 0, gun: { dmg: 3, pellets: 1, spread: 6, reload: 220 } },
  { id: 'shotgun', cat: 'gun', name: 'Двустволка', desc: '9 дробин, урон 5. Медленная.', cost: 200, gun: { dmg: 5, pellets: 9, spread: 80, reload: 520 } },
  { id: 'uzi', cat: 'gun', name: 'Пулемётик', desc: 'Держите палец — строчит. Урон 5.', cost: 580, gun: { dmg: 5, pellets: 1, spread: 30, reload: 60 } },
  { id: 'magnum', cat: 'gun', name: 'Револьвер «Удача»', desc: 'Урон 18. Для лещей и выше.', cost: 3000, gun: { dmg: 18, pellets: 1, spread: 4, reload: 330 } },

  { id: 'toaster', cat: 'tech', name: 'Тостер', desc: 'На спуске бьёт током первую рыбу — спуск продолжается.', cost: 150 },
  { id: 'lamp', cat: 'tech', name: 'Фонарик', desc: 'На глубине станет светлее.', cost: 300 },
  { id: 'spring', cat: 'tech', name: 'Пружина', desc: 'Улов дольше висит в воздухе.', cost: 400 },

  { id: 'telnyashka', cat: 'wear', name: 'Тельняшка', desc: '+10% к цене каждой рыбы.', cost: 1000 },
];

export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP.map((s) => [s.id, s]));

export const CAT_NAMES: Record<ShopCat, string> = {
  reel: 'Катушки',
  gun: 'Оружие',
  tech: 'Снаряжение',
  wear: 'Одежда',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
