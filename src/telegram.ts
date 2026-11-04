// Обёртка над Telegram WebApp API. Игра работает и без Telegram (в обычном браузере).

const tg: any = (window as any).Telegram?.WebApp;

export const inTelegram: boolean = !!tg && typeof tg.platform === 'string' && tg.platform !== 'unknown';

function atLeast(v: string): boolean {
  try {
    return inTelegram && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);
  } catch {
    return false;
  }
}

export function initTelegram(): void {
  if (!inTelegram) return;
  try {
    tg.ready();
    tg.expand();
    if (atLeast('7.7')) tg.disableVerticalSwipes();
    if (atLeast('8.0')) tg.lockOrientation();
    if (atLeast('6.1')) {
      tg.setHeaderColor('#7cc6e8');
      tg.setBackgroundColor('#0b2236');
    }
  } catch (e) {
    console.warn('Telegram init', e);
  }
}

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'select'): void {
  if (!atLeast('6.1')) return;
  try {
    const h = tg.HapticFeedback;
    if (kind === 'success' || kind === 'error') h.notificationOccurred(kind);
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred(kind);
  } catch {
    /* ignore */
  }
}

// ---------- Наклон ----------
let tiltX: number | null = null;
let tiltStarted = false;

export function startTilt(): void {
  if (tiltStarted) return;
  tiltStarted = true;
  if (atLeast('8.0') && tg.Accelerometer) {
    try {
      tg.onEvent('accelerometerChanged', () => {
        tiltX = tg.Accelerometer.x;
      });
      tg.Accelerometer.start({ refresh_rate: 20 });
      return;
    } catch {
      /* перейдём к devicemotion */
    }
  }
  window.addEventListener('devicemotion', (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (a && a.x !== null) tiltX = a.x;
  });
}

/** Наклон в диапазоне −1…1 (вправо — плюс) или null, если датчика нет. */
export function getTilt(invert: boolean): number | null {
  if (tiltX === null) return null;
  // знак проверен на телефоне: наклон вправо → блесна вправо
  const v = Math.max(-1, Math.min(1, tiltX / 4.5));
  return invert ? -v : v;
}

// ---------- Кнопка «Назад» ----------
let backHandler: (() => void) | null = null;

export function showBack(fn: () => void): void {
  if (!inTelegram || !atLeast('6.1')) return;
  hideBack();
  backHandler = fn;
  tg.BackButton.onClick(fn);
  tg.BackButton.show();
}

export function hideBack(): void {
  if (!inTelegram || !atLeast('6.1')) return;
  if (backHandler) tg.BackButton.offClick(backHandler);
  backHandler = null;
  tg.BackButton.hide();
}

// ---------- Облачное хранилище ----------
export const hasCloud: boolean = atLeast('6.9');

export function cloudGet(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!hasCloud) return resolve(null);
    const timer = setTimeout(() => resolve(null), 3000);
    try {
      tg.CloudStorage.getItem(key, (err: unknown, value: string) => {
        clearTimeout(timer);
        resolve(err ? null : value || null);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

export function cloudSet(key: string, value: string): void {
  if (!hasCloud) return;
  try {
    tg.CloudStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
