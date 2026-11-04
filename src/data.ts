// Игровые данные: зоны, рыбы, магазин. Все рыбы, тексты и предметы — свои.

export const W = 720;
export const H = 1280;
export const PPM = 26; // пикселей на метр глубины
export const WATER_Y = 1180; // мировая координата поверхности воды

export type Shape =
  | 'normal' | 'tall' | 'long' | 'ruff' | 'striped' | 'cat' | 'gold' | 'sturgeon' | 'sail' | 'flat'
  | 'crab' | 'squid' | 'angler' | 'seal'
  | 'boot' | 'can' | 'tire' | 'anchor' | 'bottle' | 'buoy';
/** junk — мусор (минус деньги), protected — охраняемое животное («Штраф») */
export type Kind = 'fish' | 'junk' | 'protected' | 'boss' | 'rare';
export type ZoneId = 'pond' | 'volga' | 'baikal' | 'barents';
export type Mechanic = 'none' | 'current' | 'ice' | 'endless';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  depth: number; // глубина дна, м (Infinity — бездна)
  unlock: number; // сколько видов нужно поймать
  mechanic: Mechanic;
  about: string;
  sky: [number, number];
  water: [number, number];
  visualDepth: number; // на этой глубине вода становится самой тёмной
  dark: number; // максимальная темнота 0…1
  darkBase: number; // темнота сразу под поверхностью
  floor: number;
  walls: boolean; // стенки из рыб с проходом
}

export const ZONES: ZoneDef[] = [
  { id: 'pond', name: 'Родной пруд', depth: 300, unlock: 0, mechanic: 'none',
    about: 'Тихая вода за деревней. Здесь всё начинается.',
    sky: [0x6fbde6, 0xcdeaf5], water: [0x3f93c4, 0x061420], visualDepth: 300, dark: 0.68, darkBase: 0, floor: 0x3b3222, walls: false },
  { id: 'volga', name: 'Волга-матушка', depth: 500, unlock: 8, mechanic: 'current',
    about: 'Течение сносит блесну в сторону, и на каждой глубине — по-своему.',
    sky: [0x8fc7e8, 0xf0e6cf], water: [0x4f8a84, 0x07130f], visualDepth: 500, dark: 0.72, darkBase: 0.05, floor: 0x3a3424, walls: true },
  { id: 'baikal', name: 'Байкал подо льдом', depth: 700, unlock: 15, mechanic: 'ice',
    about: 'Заброс в прорубь. Подо льдом темно, а улов отскакивает ото льда.',
    sky: [0xaecbe2, 0xf4f8fb], water: [0x2c6a8a, 0x010409], visualDepth: 600, dark: 0.86, darkBase: 0.25, floor: 0x2a2e33, walls: true },
  { id: 'barents', name: 'Баренцево море', depth: Infinity, unlock: 24, mechanic: 'endless',
    about: 'Дна нет. Чем глубже, тем гуще и опаснее. Каждые 500 м — гигантский кальмар.',
    sky: [0x93a8ba, 0xdde5eb], water: [0x2a5a78, 0x000306], visualDepth: 1500, dark: 0.8, darkBase: 0.05, floor: 0x000000, walls: true },
];

export const ZONE_BY_ID: Record<ZoneId, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, ZoneDef>;

export interface FishDef {
  id: string;
  zone: ZoneId;
  ghost?: boolean; // почти прозрачна, видна в свете блесны
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
  { id: 'peskar', zone: 'pond', name: 'Пескарь', desc: 'Мудрый, но осторожный. Чаще второе.', hint: 'Водится у самой поверхности.',
    value: 3, hp: 1, w: 46, h: 18, color: 0x9aa89e, belly: 0xdfe6dc, fin: 0x7d8a80, speed: 45,
    minD: 0, midD: 25, maxD: 90, perHundred: 14, kind: 'fish', shape: 'normal' },
  { id: 'ukleyka', zone: 'pond', name: 'Уклейка', desc: 'Блестит как новая копейка и так же мало стоит.', hint: 'Мелководье, ближе к 50 м.',
    value: 5, hp: 1, w: 52, h: 16, color: 0xb9c9d8, belly: 0xf2f6fa, fin: 0x9fb1c2, speed: 80,
    minD: 10, midD: 55, maxD: 130, perHundred: 12, kind: 'fish', shape: 'normal' },
  { id: 'karas', zone: 'pond', name: 'Карась', desc: 'Круглый, золотистый и уверенный, что щук не бывает.', hint: 'Глубина 50–150 м.',
    value: 8, hp: 2, w: 52, h: 38, color: 0xc9a23a, belly: 0xf0d98a, fin: 0xa3802a, speed: 35,
    minD: 30, midD: 90, maxD: 160, perHundred: 11, kind: 'fish', shape: 'tall' },
  { id: 'plotva', zone: 'pond', name: 'Плотва', desc: 'Красноглазая и красноперая. Не выспалась.', hint: 'Глубина 60–200 м.',
    value: 12, hp: 2, w: 56, h: 26, color: 0x9fb0c4, belly: 0xe8eef4, fin: 0xd9533b, speed: 55,
    minD: 60, midD: 120, maxD: 200, perHundred: 9, kind: 'fish', shape: 'normal' },
  { id: 'yorsh', zone: 'pond', name: 'Ёрш', desc: 'Колючий характер, колючий плавник, колючий взгляд.', hint: 'Держится глубже 80 м.',
    value: 15, hp: 3, w: 46, h: 24, color: 0x7e7a4e, belly: 0xc9c49a, fin: 0x55522f, speed: 40,
    minD: 80, midD: 150, maxD: 220, perHundred: 8, kind: 'fish', shape: 'ruff' },
  { id: 'okun', zone: 'pond', name: 'Окунь', desc: 'Полосатый хулиган. Носит тельняшку с рождения.', hint: 'Глубина 100–250 м.',
    value: 22, hp: 3, w: 58, h: 32, color: 0x8faa3e, belly: 0xe2e7b0, fin: 0xe0632f, speed: 60,
    minD: 100, midD: 180, maxD: 250, perHundred: 8, kind: 'fish', shape: 'striped' },
  { id: 'leshch', zone: 'pond', name: 'Лещ', desc: 'Плоский, как анекдот деда. И такой же тяжёлый.', hint: 'Глубже 150 м.',
    value: 40, hp: 6, w: 74, h: 54, color: 0x8c7f5c, belly: 0xd8ccaa, fin: 0x5f5640, speed: 30,
    minD: 150, midD: 230, maxD: 290, perHundred: 5, kind: 'fish', shape: 'tall' },
  { id: 'sudak', zone: 'pond', name: 'Судак', desc: 'Клыкастый и обидчивый. Подаётся в заливном.', hint: 'Глубина 190–300 м.',
    value: 70, hp: 8, w: 86, h: 28, color: 0x8495a4, belly: 0xdde3e8, fin: 0x5d6b78, speed: 70,
    minD: 190, midD: 260, maxD: 300, perHundred: 4, kind: 'fish', shape: 'long' },
  { id: 'shchuka', zone: 'pond', name: 'Щука', desc: 'Исполняет желания, но только свои.', hint: 'Самое дно пруда, быстро плавает.',
    value: 120, hp: 12, w: 118, h: 28, color: 0x5d7d3a, belly: 0xd5dfa8, fin: 0x45602a, speed: 100,
    minD: 220, midD: 285, maxD: 300, perHundred: 3, kind: 'fish', shape: 'long' },
  { id: 'zolotaya', zone: 'pond', name: 'Золотая рыбка', desc: 'Три желания не исполняет. Зато стоит как три улова.', hint: 'Редкая. Иногда мелькает глубже 240 м.',
    value: 500, hp: 3, w: 48, h: 32, color: 0xf2b822, belly: 0xffe58a, fin: 0xe07a12, speed: 140,
    minD: 240, midD: 270, maxD: 298, perHundred: 0, kind: 'rare', shape: 'gold', odds: 0.4 },
  { id: 'som', zone: 'pond', name: 'Сом Потапыч', desc: 'Хозяин пруда. Помнит ещё прадеда.', hint: 'Лежит на самом дне. Нужна леска 300 м.',
    value: 800, hp: 140, w: 250, h: 84, color: 0x4b4a3e, belly: 0x9a967c, fin: 0x34332b, speed: 25,
    minD: 296, midD: 296, maxD: 296, perHundred: 0, kind: 'boss', shape: 'cat' },
  // Мусор: ловится как рыба, но выстрел по нему стоит денег.
  { id: 'sapog', zone: 'pond', name: 'Старый сапог', desc: 'Левый. Правый ищут до сих пор.', hint: 'Не стреляйте в него!',
    value: -5, hp: 2, w: 40, h: 54, color: 0x5a3b26, belly: 0x3e2819, fin: 0x2a1b10, speed: 12,
    minD: 5, midD: 100, maxD: 300, perHundred: 3, kind: 'junk', shape: 'boot' },
  { id: 'banka', zone: 'pond', name: 'Консервная банка', desc: 'Килька в томате. Была.', hint: 'Не стреляйте в неё!',
    value: -10, hp: 2, w: 32, h: 42, color: 0xa7adb3, belly: 0xc23a2b, fin: 0x6e7479, speed: 14,
    minD: 50, midD: 180, maxD: 300, perHundred: 3, kind: 'junk', shape: 'can' },
  { id: 'shina', zone: 'pond', name: 'Шина', desc: 'От «Москвича». Протектор ещё ничего.', hint: 'Не стреляйте в неё!',
    value: -25, hp: 6, w: 64, h: 64, color: 0x26262a, belly: 0x55555c, fin: 0x111114, speed: 10,
    minD: 150, midD: 260, maxD: 300, perHundred: 2, kind: 'junk', shape: 'tire' },
  // ===================== ВОЛГА-МАТУШКА (500 м, течение) =====================
  { id: 'golavl', zone: 'volga', name: 'Голавль', desc: 'Лобастый. Ест всё, включая чужие планы на вечер.', hint: 'Верхние 150 м Волги.',
    value: 18, hp: 3, w: 56, h: 26, color: 0x8a9aa8, belly: 0xe3e8ec, fin: 0xd9663b, speed: 60,
    minD: 10, midD: 70, maxD: 180, perHundred: 13, kind: 'fish', shape: 'normal' },
  { id: 'chekhon', zone: 'volga', name: 'Чехонь', desc: 'Плоская сабля. Вяленая — легенда.', hint: 'Быстрая, 30–200 м.',
    value: 22, hp: 2, w: 66, h: 18, color: 0xc9d6e2, belly: 0xf4f7fa, fin: 0xa9b8c6, speed: 115,
    minD: 30, midD: 110, maxD: 210, perHundred: 10, kind: 'fish', shape: 'normal' },
  { id: 'yaz', zone: 'volga', name: 'Язь', desc: 'Красивый и знает об этом.', hint: 'Глубина 60–250 м.',
    value: 28, hp: 4, w: 60, h: 32, color: 0xa9a27a, belly: 0xece4c4, fin: 0xc94a2f, speed: 50,
    minD: 60, midD: 150, maxD: 260, perHundred: 10, kind: 'fish', shape: 'tall' },
  { id: 'zherekh', zone: 'volga', name: 'Жерех', desc: 'Бьёт малька хвостом, как веслом.', hint: 'Глубина 120–320 м, очень быстрый.',
    value: 45, hp: 6, w: 78, h: 26, color: 0x8193a0, belly: 0xe2e8ec, fin: 0x5f6f7c, speed: 125,
    minD: 120, midD: 220, maxD: 330, perHundred: 7, kind: 'fish', shape: 'long' },
  { id: 'sazan', zone: 'volga', name: 'Сазан', desc: 'Дикий карп. Тянет так, что лодку разворачивает.', hint: 'Глубина 180–400 м.',
    value: 60, hp: 8, w: 74, h: 46, color: 0xb08a3a, belly: 0xecd590, fin: 0x7a5c22, speed: 40,
    minD: 180, midD: 290, maxD: 410, perHundred: 6, kind: 'fish', shape: 'tall' },
  { id: 'nalim', zone: 'volga', name: 'Налим', desc: 'Единственная пресноводная треска. Гордится.', hint: 'Глубже 250 м.',
    value: 75, hp: 8, w: 84, h: 26, color: 0x6b6a3a, belly: 0xc7c49a, fin: 0x4a4928, speed: 35,
    minD: 250, midD: 360, maxD: 460, perHundred: 5, kind: 'fish', shape: 'cat' },
  { id: 'sterlyad', zone: 'volga', name: 'Стерлядь', desc: 'Царская уха. Нос — как у деда в очках.', hint: 'Глубже 300 м.',
    value: 110, hp: 10, w: 96, h: 24, color: 0x6f7f8a, belly: 0xd8dde0, fin: 0x4c5860, speed: 55,
    minD: 300, midD: 420, maxD: 495, perHundred: 4, kind: 'fish', shape: 'sturgeon' },
  { id: 'carfish', zone: 'volga', name: 'Царь-рыба', desc: 'Про неё рассказывают у костра. Теперь и вы будете.', hint: 'Редкая. Мелькает глубже 400 м.',
    value: 900, hp: 6, w: 104, h: 28, color: 0xd4a52a, belly: 0xffe58a, fin: 0xa37812, speed: 160,
    minD: 400, midD: 450, maxD: 495, perHundred: 0, kind: 'rare', shape: 'sturgeon', odds: 0.3 },
  { id: 'beluga', zone: 'volga', name: 'Белуга-бабушка', desc: 'Старше пароходов. Всё ещё обижена на плотины.', hint: 'Дно Волги, 500 м.',
    value: 2500, hp: 260, w: 300, h: 88, color: 0x8e9aa3, belly: 0xdfe4e8, fin: 0x5d6871, speed: 20,
    minD: 496, midD: 496, maxD: 496, perHundred: 0, kind: 'boss', shape: 'sturgeon' },
  { id: 'butylka', zone: 'volga', name: 'Бутылка с запиской', desc: '«Спасите, я на Волге». Без даты.', hint: 'Не стреляйте в неё!',
    value: -15, hp: 2, w: 26, h: 50, color: 0x3d7a4a, belly: 0xf0e2b8, fin: 0x24502f, speed: 18,
    minD: 0, midD: 150, maxD: 450, perHundred: 3, kind: 'junk', shape: 'bottle' },
  { id: 'yakor', zone: 'volga', name: 'Якорь', desc: 'С баржи «Стремительная». Не стремился.', hint: 'Не стреляйте в него!',
    value: -30, hp: 10, w: 54, h: 60, color: 0x4a4e52, belly: 0x6b7075, fin: 0x2c2f32, speed: 8,
    minD: 120, midD: 380, maxD: 500, perHundred: 2, kind: 'junk', shape: 'anchor' },

  // ===================== БАЙКАЛ ПОДО ЛЬДОМ (700 м, лёд) =====================
  { id: 'bychok', zone: 'baikal', name: 'Бычок-широколобка', desc: 'Голова шире совести. Живёт только здесь.', hint: 'Верхние 200 м Байкала.',
    value: 14, hp: 2, w: 48, h: 24, color: 0x8a7a5a, belly: 0xd8ccaa, fin: 0x5e5238, speed: 30,
    minD: 8, midD: 60, maxD: 200, perHundred: 14, kind: 'fish', shape: 'normal' },
  { id: 'omul', zone: 'baikal', name: 'Омуль', desc: 'Главная рыба Байкала. Копчёный — лучший.', hint: 'Глубина 40–300 м.',
    value: 30, hp: 3, w: 60, h: 22, color: 0x9fb6c4, belly: 0xeef3f6, fin: 0x7a92a2, speed: 85,
    minD: 40, midD: 150, maxD: 300, perHundred: 12, kind: 'fish', shape: 'normal' },
  { id: 'harius', zone: 'baikal', name: 'Хариус', desc: 'Плавник-парус. Сфотографируйте, пока не уплыл.', hint: 'Глубина 80–350 м.',
    value: 40, hp: 4, w: 58, h: 26, color: 0x7c8a9a, belly: 0xdde3ea, fin: 0xa04a8a, speed: 70,
    minD: 80, midD: 200, maxD: 350, perHundred: 9, kind: 'fish', shape: 'sail' },
  { id: 'sig', zone: 'baikal', name: 'Сиг', desc: 'Серебряный, вежливый, всегда в чешуе.', hint: 'Глубина 150–450 м.',
    value: 50, hp: 5, w: 64, h: 26, color: 0xc4ccd2, belly: 0xf3f5f7, fin: 0x8a959e, speed: 60,
    minD: 150, midD: 300, maxD: 460, perHundred: 8, kind: 'fish', shape: 'normal' },
  { id: 'lenok', zone: 'baikal', name: 'Ленок', desc: 'Пятнистый, как старый свитер.', hint: 'Глубина 250–550 м.',
    value: 70, hp: 7, w: 70, h: 26, color: 0xa0705a, belly: 0xe6cdb8, fin: 0x6e4a3a, speed: 65,
    minD: 250, midD: 400, maxD: 560, perHundred: 6, kind: 'fish', shape: 'long' },
  { id: 'golomyanka', zone: 'baikal', name: 'Голомянка', desc: 'Прозрачная. Видно, что она ела на завтрак.', hint: 'Глубоко. Видна только в свете блесны.',
    value: 90, hp: 2, w: 52, h: 18, color: 0xf2d4dc, belly: 0xfff0f4, fin: 0xe6b8c4, speed: 40, ghost: true,
    minD: 300, midD: 550, maxD: 690, perHundred: 9, kind: 'fish', shape: 'normal' },
  { id: 'taimen', zone: 'baikal', name: 'Таймень', desc: 'Сибирский лосось-людоед. Ну, почти.', hint: 'Самые глубокие места Байкала.',
    value: 160, hp: 14, w: 116, h: 30, color: 0x8a4a3a, belly: 0xe2b8a6, fin: 0x5e2c22, speed: 110,
    minD: 450, midD: 600, maxD: 690, perHundred: 4, kind: 'fish', shape: 'long' },
  { id: 'albinos', zone: 'baikal', name: 'Ленок-альбинос', desc: 'Белый, как байкальский лёд в марте.', hint: 'Редкий. Глубже 600 м.',
    value: 700, hp: 5, w: 70, h: 26, color: 0xf4f1ea, belly: 0xffffff, fin: 0xdcd2c4, speed: 140,
    minD: 600, midD: 650, maxD: 692, perHundred: 0, kind: 'rare', shape: 'long', odds: 0.35 },
  { id: 'hozyain', zone: 'baikal', name: 'Хозяин Байкала', desc: 'Древний осётр. Помнит, как Байкал был лужей.', hint: 'Дно Байкала, 700 м.',
    value: 4000, hp: 380, w: 320, h: 96, color: 0x4e5a52, belly: 0xa9b3ab, fin: 0x323b35, speed: 18,
    minD: 696, midD: 696, maxD: 696, perHundred: 0, kind: 'boss', shape: 'sturgeon' },
  { id: 'nerpa', zone: 'baikal', name: 'Нерпа', desc: 'Байкальский тюлень. Охраняется законом и всеми нами.', hint: 'Охраняемое животное. Не стрелять — штраф!',
    value: -50, hp: 4, w: 72, h: 40, color: 0x7d8a96, belly: 0xb9c3cc, fin: 0x55606b, speed: 70,
    minD: 30, midD: 250, maxD: 650, perHundred: 3, kind: 'protected', shape: 'seal' },
  { id: 'valenok', zone: 'baikal', name: 'Валенок', desc: 'Пропал на подлёдной рыбалке в 1987-м.', hint: 'Не стреляйте в него!',
    value: -8, hp: 2, w: 42, h: 56, color: 0x6e6e6e, belly: 0x8a8a8a, fin: 0x4a4a4a, speed: 10,
    minD: 0, midD: 120, maxD: 500, perHundred: 3, kind: 'junk', shape: 'boot' },
  { id: 'vedro', zone: 'baikal', name: 'Ведро', desc: 'Для рыбы. Рыбы в нём нет.', hint: 'Не стреляйте в него!',
    value: -15, hp: 3, w: 40, h: 46, color: 0x8a9096, belly: 0xb4b9be, fin: 0x5d6368, speed: 10,
    minD: 100, midD: 400, maxD: 690, perHundred: 2, kind: 'junk', shape: 'can' },

  // ===================== БАРЕНЦЕВО МОРЕ (бездна) =====================
  { id: 'moiva', zone: 'barents', name: 'Мойва', desc: 'Маленькая, но её много. Как комаров.', hint: 'Самый верх моря.',
    value: 6, hp: 1, w: 42, h: 14, color: 0x9fb0b8, belly: 0xe8eef0, fin: 0x7e9098, speed: 95,
    minD: 5, midD: 50, maxD: 200, perHundred: 18, kind: 'fish', shape: 'normal' },
  { id: 'seld', zone: 'barents', name: 'Сельдь', desc: 'Под шубой не видели, а в море — сколько угодно.', hint: 'Глубина 20–300 м.',
    value: 12, hp: 2, w: 52, h: 18, color: 0x7f9cb3, belly: 0xe6eef4, fin: 0x5f7c93, speed: 90,
    minD: 20, midD: 120, maxD: 300, perHundred: 15, kind: 'fish', shape: 'normal' },
  { id: 'piksha', zone: 'barents', name: 'Пикша', desc: 'С чёрным пятном «от пальца святого». Так говорят.', hint: 'Глубина 80–500 м.',
    value: 30, hp: 4, w: 62, h: 26, color: 0x8f98a0, belly: 0xe2e6e9, fin: 0x4e565c, speed: 55,
    minD: 80, midD: 250, maxD: 500, perHundred: 9, kind: 'fish', shape: 'normal' },
  { id: 'treska', zone: 'barents', name: 'Треска', desc: 'Кормила поморов веками. Уважайте.', hint: 'Глубина 100–600 м.',
    value: 35, hp: 5, w: 70, h: 30, color: 0x8a8a5a, belly: 0xe6e2c4, fin: 0x5e5e3a, speed: 50,
    minD: 100, midD: 300, maxD: 600, perHundred: 9, kind: 'fish', shape: 'cat' },
  { id: 'okun_m', zone: 'barents', name: 'Морской окунь', desc: 'Красный, колючий и живёт сто лет.', hint: 'Глубина 200–800 м.',
    value: 50, hp: 5, w: 56, h: 32, color: 0xd2553a, belly: 0xf2b8a6, fin: 0xa33a24, speed: 45,
    minD: 200, midD: 450, maxD: 800, perHundred: 7, kind: 'fish', shape: 'ruff' },
  { id: 'zubatka', zone: 'barents', name: 'Зубатка', desc: 'Зубы как у бобра, характер как у волка.', hint: 'Глубина 300–1000 м.',
    value: 80, hp: 8, w: 94, h: 28, color: 0x6d7a88, belly: 0xc9d0d6, fin: 0x4a5560, speed: 45,
    minD: 300, midD: 600, maxD: 1000, perHundred: 5, kind: 'fish', shape: 'striped' },
  { id: 'paltus', zone: 'barents', name: 'Палтус', desc: 'Оба глаза на одной стороне. Видел всё дважды.', hint: 'Глубже 400 м.',
    value: 120, hp: 12, w: 92, h: 54, color: 0x6a5a46, belly: 0x9a8a70, fin: 0x4a3e30, speed: 30,
    minD: 400, midD: 800, maxD: 1500, perHundred: 4, kind: 'fish', shape: 'flat' },
  { id: 'krab', zone: 'barents', name: 'Камчатский краб', desc: 'Приехал с Камчатки и остался. Ходит боком.', hint: 'Глубже 500 м.',
    value: 150, hp: 14, w: 76, h: 50, color: 0xc0432f, belly: 0xe2826e, fin: 0x8a2a1c, speed: 25,
    minD: 500, midD: 1000, maxD: 2200, perHundred: 4, kind: 'fish', shape: 'crab' },
  { id: 'morchort', zone: 'barents', name: 'Морской чёрт', desc: 'Красивым его не назовёшь. Вкусным — да.', hint: 'Глубже 700 м.',
    value: 200, hp: 16, w: 94, h: 64, color: 0x6b5a40, belly: 0x9a8a6a, fin: 0x4a3e2a, speed: 25,
    minD: 700, midD: 1400, maxD: 3200, perHundred: 3, kind: 'fish', shape: 'angler' },
  { id: 'udilshik', zone: 'barents', name: 'Удильщик', desc: 'Носит фонарик на лбу. Как вы, только злее.', hint: 'Глубже 1000 м, светится.',
    value: 300, hp: 10, w: 64, h: 52, color: 0x2e2e3e, belly: 0x4a4a5e, fin: 0x1c1c28, speed: 30,
    minD: 1000, midD: 2500, maxD: 99999, perHundred: 4, kind: 'fish', shape: 'angler' },
  { id: 'akula', zone: 'barents', name: 'Полярная акула', desc: 'Живёт 400 лет и никуда не торопится.', hint: 'Редкая. Глубже 600 м.',
    value: 1500, hp: 40, w: 170, h: 50, color: 0x5a6670, belly: 0xa9b3ba, fin: 0x3c464e, speed: 60,
    minD: 600, midD: 1500, maxD: 99999, perHundred: 0, kind: 'rare', shape: 'long', odds: 0.3 },
  { id: 'kalmar', zone: 'barents', name: 'Гигантский кальмар', desc: 'Глаз размером с тарелку. Смотрит на вас.', hint: 'Каждые 500 м бездны.',
    value: 3000, hp: 300, w: 240, h: 110, color: 0xc4553f, belly: 0xe89a86, fin: 0x8a3020, speed: 22,
    minD: 500, midD: 500, maxD: 500, perHundred: 0, kind: 'boss', shape: 'squid' },
  { id: 'beluha', zone: 'barents', name: 'Белуха', desc: 'Белый кит Арктики. Поёт. Охраняется.', hint: 'Охраняемое животное. Не стрелять — штраф!',
    value: -100, hp: 8, w: 116, h: 46, color: 0xeef2f5, belly: 0xffffff, fin: 0xc9d2d8, speed: 60,
    minD: 50, midD: 400, maxD: 1500, perHundred: 2, kind: 'protected', shape: 'seal' },
  { id: 'buy', zone: 'barents', name: 'Буй', desc: 'Сорвался с якоря. Дрейфует в поисках себя.', hint: 'Не стреляйте в него!',
    value: -20, hp: 4, w: 46, h: 58, color: 0xd9533b, belly: 0xffffff, fin: 0x7a2a1c, speed: 12,
    minD: 0, midD: 300, maxD: 1200, perHundred: 2, kind: 'junk', shape: 'buoy' },
  { id: 'bochka', zone: 'barents', name: 'Бочка', desc: 'Из-под трески. Пахнет соответствующе.', hint: 'Не стреляйте в неё!',
    value: -30, hp: 8, w: 48, h: 60, color: 0x7a5232, belly: 0x9a7a5a, fin: 0x3a2a1a, speed: 10,
    minD: 100, midD: 900, maxD: 99999, perHundred: 2, kind: 'junk', shape: 'can' },
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
  { id: 'reel500', cat: 'reel', name: 'Леска 500 м', desc: 'До дна Волги.', cost: 2500, reelDepth: 500, requires: 'reel300' },
  { id: 'reel700', cat: 'reel', name: 'Леска 700 м', desc: 'До дна Байкала.', cost: 6000, reelDepth: 700, requires: 'reel500' },
  { id: 'reelInf', cat: 'reel', name: 'Бездонная катушка', desc: 'Леска не кончается. Для Баренцева моря.', cost: 15000, reelDepth: 99999, requires: 'reel700' },

  { id: 'pistol', cat: 'gun', name: 'Пистолет', desc: 'Старый друг. Урон 3.', cost: 0, gun: { dmg: 3, pellets: 1, spread: 6, reload: 220 } },
  { id: 'shotgun', cat: 'gun', name: 'Двустволка', desc: '9 дробин, урон 5. Медленная.', cost: 200, gun: { dmg: 5, pellets: 9, spread: 80, reload: 520 } },
  { id: 'uzi', cat: 'gun', name: 'Пулемётик', desc: 'Держите палец — строчит. Урон 5.', cost: 580, gun: { dmg: 5, pellets: 1, spread: 30, reload: 60 } },
  { id: 'magnum', cat: 'gun', name: 'Револьвер «Удача»', desc: 'Урон 18. Для лещей и выше.', cost: 3000, gun: { dmg: 18, pellets: 1, spread: 4, reload: 330 } },
  { id: 'minigun', cat: 'gun', name: 'Миниган «Гром»', desc: 'Урон 4, но очень часто. Для боссов.', cost: 8000, requires: 'uzi', gun: { dmg: 4, pellets: 1, spread: 28, reload: 32 } },

  { id: 'toaster', cat: 'tech', name: 'Тостер', desc: 'На спуске бьёт током первую рыбу — спуск продолжается.', cost: 150 },
  { id: 'lamp', cat: 'tech', name: 'Фонарик', desc: 'На глубине станет светлее.', cost: 300 },
  { id: 'spring', cat: 'tech', name: 'Пружина', desc: 'Улов дольше висит в воздухе.', cost: 400 },
  { id: 'projector', cat: 'tech', name: 'Прожектор', desc: 'Почти дневной свет. Голомянка не спрячется.', cost: 3500, requires: 'lamp' },

  { id: 'telnyashka', cat: 'wear', name: 'Тельняшка', desc: '+10% к цене каждой рыбы.', cost: 1000 },
  { id: 'vatnik', cat: 'wear', name: 'Ватник', desc: '+25% к цене рыбы. Тепло и солидно.', cost: 7000, requires: 'telnyashka' },
];

export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP.map((s) => [s.id, s]));

export const CAT_NAMES: Record<ShopCat, string> = {
  reel: 'Катушки',
  gun: 'Оружие',
  tech: 'Снаряжение',
  wear: 'Одежда',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
