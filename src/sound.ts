// Мини-синтезатор звуков на WebAudio — без файлов.
import { S } from './save';

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext | null {
  if (!S.d.sound) return null;
  try {
    if (!ctx) {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C() as AudioContext;
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

function noise(dur: number, vol: number, freq: number): void {
  const c = ac();
  if (!c || !noiseBuf) return;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start();
  s.stop(c.currentTime + dur);
}

export const sfx = {
  shot: () => {
    noise(0.08, 0.28, 3200);
    tone(150, 0.07, 'square', 0.05, 60);
  },
  heavyShot: () => {
    noise(0.22, 0.4, 1400);
    tone(90, 0.16, 'square', 0.08, 40);
  },
  hit: () => tone(190, 0.07, 'square', 0.07, 80),
  casing: () => tone(2600, 0.04, 'triangle', 0.025, 1800),
  hook: () => tone(660, 0.08, 'square', 0.06, 880),
  zap: () => tone(1200, 0.18, 'sawtooth', 0.05, 200),
  coin: () => {
    tone(988, 0.07, 'square', 0.05);
    setTimeout(() => tone(1318, 0.12, 'square', 0.05), 60);
  },
  bad: () => tone(220, 0.25, 'sawtooth', 0.07, 110),
  splash: () => noise(0.3, 0.15, 700),
  cast: () => tone(300, 0.25, 'triangle', 0.08, 900),
  click: () => tone(520, 0.05, 'triangle', 0.06),
};
